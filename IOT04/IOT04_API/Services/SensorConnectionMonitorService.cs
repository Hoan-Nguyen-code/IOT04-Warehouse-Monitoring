
using IOT04_API.Data;
using IOT04_API.Models;
using Microsoft.EntityFrameworkCore;

namespace IOT04_API.Services;

public class SensorConnectionMonitorService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SensorConnectionMonitorService> _logger;

    public SensorConnectionMonitorService(
        IServiceScopeFactory scopeFactory,
        ILogger<SensorConnectionMonitorService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(
            TimeSpan.FromSeconds(5));

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await KiemTraKetNoiAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex, "Loi kiem tra ket noi cam bien");
                }
            }
        }
        catch (OperationCanceledException)
            when (stoppingToken.IsCancellationRequested)
        {
            // Service dang dung
        }
    }

    private async Task KiemTraKetNoiAsync(
        CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();

        var db = scope.ServiceProvider
            .GetRequiredService<Iot04DbContext>();

        // Chi giam sat 2 cam bien ESP32 dang su dung
        var camBiens = await db.CamBiens
            .Where(c => c.MaCamBien == 1 || c.MaCamBien == 3)
            .ToListAsync(cancellationToken);

        var hienTai = DateTime.Now;

        foreach (var camBien in camBiens)
        {
            // Chua tung nhan du lieu thi chua ket luan mat ket noi
            if (!camBien.ThoiDiemDuLieuCuoi.HasValue)
                continue;

            double soGiay = (
                hienTai - camBien.ThoiDiemDuLieuCuoi.Value
            ).TotalSeconds;

            if (soGiay <= camBien.NguongMatKetNoi)
                continue;

            if (camBien.TrangThai == "MAT_KET_NOI")
                continue;

            camBien.TrangThai = "MAT_KET_NOI";

            // Kiem tra canh bao mat ket noi dang ton tai
            bool daCoCanhBao = await db.NgoaiLes.AnyAsync(
                n => n.MaCamBien == camBien.MaCamBien
                    && n.LoaiNgoaiLe == "MAT_KET_NOI"
                    && n.TrangThai == "MOI",
                cancellationToken);

            if (!daCoCanhBao)
            {
                db.NgoaiLes.Add(new NgoaiLe
                {
                    MaCamBien = camBien.MaCamBien,
                    LoaiNgoaiLe = "MAT_KET_NOI",
                    MoTa =
                        $"Cam bien {camBien.TenCamBien} " +
                        $"khong gui du lieu trong {soGiay:F0} giay. " +
                        $"Nguong cho phep: " +
                        $"{camBien.NguongMatKetNoi} giay.",
                    ThoiGianPhatHien = hienTai,
                    TrangThai = "MOI"
                });
            }

            _logger.LogWarning(
                "MAT KET NOI: Sensor={Id}, LastData={Time}",
                camBien.MaCamBien,
                camBien.ThoiDiemDuLieuCuoi);
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
