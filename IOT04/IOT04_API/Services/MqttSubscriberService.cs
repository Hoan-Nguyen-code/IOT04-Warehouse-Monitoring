
using System.Text;
using System.Text.Json;
using System.Buffers;
using IOT04_API.Data;
using IOT04_API.Models;
using Microsoft.EntityFrameworkCore;
using MQTTnet;

namespace IOT04_API.Services;

public class MqttSubscriberService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MqttSubscriberService> _logger;

    private readonly IMqttClient _mqttClient;
    private readonly MqttClientOptions _mqttOptions;

    public MqttSubscriberService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<MqttSubscriberService> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;

        var factory = new MqttClientFactory();
        _mqttClient = factory.CreateMqttClient();

        string server = configuration["Mqtt:Server"]
            ?? throw new InvalidOperationException("Missing MQTT server");

        int port = configuration.GetValue<int>("Mqtt:Port", 1883);

        string username = configuration["Mqtt:Username"]
            ?? throw new InvalidOperationException("Missing MQTT username");

        string password = configuration["Mqtt:Password"]
            ?? throw new InvalidOperationException("Missing MQTT password");

        _mqttOptions = new MqttClientOptionsBuilder()
            .WithClientId("IOT04_API_Sub_" + Guid.NewGuid().ToString("N"))
            .WithTcpServer(server, port)
            .WithCredentials(username, password)
            .WithCleanSession()
            .Build();

        _mqttClient.ApplicationMessageReceivedAsync += async e =>
        {
            try
            {
                string topic = e.ApplicationMessage.Topic;

                string payload = Encoding.UTF8.GetString(
                    e.ApplicationMessage.Payload.ToArray());

                await XuLyDuLieuAsync(topic, payload);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Loi xu ly MQTT message");
            }
        };
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        string topic = _configuration["Mqtt:Topic"]
            ?? "iot04/sensors/#";

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (!_mqttClient.IsConnected)
                {
                    _logger.LogInformation("MQTT connecting...");

                    await _mqttClient.ConnectAsync(
                        _mqttOptions, stoppingToken);

                    var subscribeOptions =
                        new MqttClientSubscribeOptionsBuilder()
                            .WithTopicFilter(topic)
                            .Build();

                    await _mqttClient.SubscribeAsync(
                        subscribeOptions, stoppingToken);

                    _logger.LogInformation(
                        "MQTT connected and subscribed: {Topic}",
                        topic);
                }
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex, "MQTT connection failed. Retrying...");
            }

            try
            {
                await Task.Delay(
                    TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task XuLyDuLieuAsync(
        string topic, string payload)
    {
        // Anh xa topic MQTT voi MaCamBien trong SQL Server
        int maCamBien = topic switch
        {
            "iot04/sensors/dht11" => 1,
            "iot04/sensors/sht30" => 3,
            _ => 0
        };

        if (maCamBien == 0)
            return;

        using var document = JsonDocument.Parse(payload);
        var root = document.RootElement;

        string expectedSensor = maCamBien == 1
            ? "DHT11"
            : "SHT30";

        // Kiem tra JSON
        if (!root.TryGetProperty("sensor", out var sensorElement) ||
            sensorElement.GetString() != expectedSensor ||
            !root.TryGetProperty("temperature", out var tempElement) ||
            !root.TryGetProperty("humidity", out var humElement) ||
            !tempElement.TryGetDouble(out double nhietDo) ||
            !humElement.TryGetDouble(out double doAm))
        {
            _logger.LogWarning(
                "Invalid MQTT payload: {Topic}", topic);
            return;
        }

        // Kiem tra gia tri hop le
        if (!double.IsFinite(nhietDo) ||
            !double.IsFinite(doAm) ||
            nhietDo < -40 || nhietDo > 80 ||
            doAm < 0 || doAm > 100)
        {
            _logger.LogWarning(
                "Sensor values out of range: {Topic}", topic);
            return;
        }

        await using var scope = _scopeFactory.CreateAsyncScope();

        var db = scope.ServiceProvider
            .GetRequiredService<Iot04DbContext>();

        // Tim cam bien trong SQL Server
        var camBien = await db.CamBiens
            .FirstOrDefaultAsync(c => c.MaCamBien == maCamBien);

        if (camBien == null)
        {
            _logger.LogWarning(
                "Sensor ID {Id} not found", maCamBien);
            return;
        }

        // Lay nguong nhiet do va do am cua vung kho
        var vung = await db.Vungs
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.MaVung == camBien.MaVung);

        if (vung == null)
        {
            _logger.LogWarning(
                "Khong tim thay vung kho cua cam bien {Id}",
                maCamBien);
            return;
        }

        var thoiGian = DateTime.Now;

        // Tao du lieu cam bien
        var duLieu = new DuLieuCamBien
        {
            MaCamBien = maCamBien,
            NhietDo = nhietDo,
            DoAm = doAm,
            ThoiGianGhiNhan = thoiGian
        };

        db.DuLieuCamBiens.Add(duLieu);

        // Cap nhat trang thai cam bien
        camBien.TrangThai = "DANG_HOAT_DONG";
        camBien.ThoiDiemDuLieuCuoi = thoiGian;

        // Kiem tra nhiet do vuot nguong
        if (nhietDo < vung.NhietDoMin ||
            nhietDo > vung.NhietDoMax)
        {
            db.NgoaiLes.Add(new NgoaiLe
            {
                MaCamBien = maCamBien,
                MaDuLieuNavigation = duLieu,
                LoaiNgoaiLe = "VUOT_NGUONG_NHIET_DO",
                MoTa =
                    $"Nhiet do {nhietDo} C nam ngoai khoang " +
                    $"{vung.NhietDoMin} - {vung.NhietDoMax} C.",
                ThoiGianPhatHien = thoiGian,
                TrangThai = "MOI"
            });

            _logger.LogWarning(
                "CANH BAO NHIET DO: Sensor={Id}, Temp={Temp}",
                maCamBien, nhietDo);
        }

        // Kiem tra do am vuot nguong
        if (doAm < vung.DoAmMin ||
            doAm > vung.DoAmMax)
        {
            db.NgoaiLes.Add(new NgoaiLe
            {
                MaCamBien = maCamBien,
                MaDuLieuNavigation = duLieu,
                LoaiNgoaiLe = "VUOT_NGUONG_DO_AM",
                MoTa =
                    $"Do am {doAm}% nam ngoai khoang " +
                    $"{vung.DoAmMin} - {vung.DoAmMax}%.",
                ThoiGianPhatHien = thoiGian,
                TrangThai = "MOI"
            });

            _logger.LogWarning(
                "CANH BAO DO AM: Sensor={Id}, Hum={Hum}",
                maCamBien, doAm);
        }

        // Luu du lieu, trang thai va canh bao
        await db.SaveChangesAsync();

        _logger.LogInformation(
            "MQTT saved: Sensor={Id}, Temp={Temp}, Hum={Hum}",
            maCamBien, nhietDo, doAm);
    }

    public override async Task StopAsync(
        CancellationToken cancellationToken)
    {
        await base.StopAsync(cancellationToken);

        if (_mqttClient.IsConnected)
        {
            await _mqttClient.DisconnectAsync();
        }

        _mqttClient.Dispose();
    }
}
