
using IOT04_API.Data;
using IOT04_API.Models;
using Microsoft.EntityFrameworkCore;

namespace IOT04_API.Services;

public class SensorDriftMonitorService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SensorDriftMonitorService> _logger;

    private const int Dht11Id = 1;
    private const int Sht30Id = 3;

    private const double NguongNhietDo = 3.0;
    private const double NguongDoAm = 15.0;

    private const int SoLanLienTiep = 3;

    private int _soLanSaiLech = 0;

    // Ghi nho cap du lieu da kiem tra,
    // tranh dem lai mot cap du lieu nhieu lan
    private long _lastDhtDataId = 0;
    private long _lastShtDataId = 0;

    public SensorDriftMonitorService(
        IServiceScopeFactory scopeFactory,
        ILogger<SensorDriftMonitorService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "SensorDriftMonitorService started");

        using var timer = new PeriodicTimer(
            TimeSpan.FromSeconds(5));

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await KiemTraDriftAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex, "Loi kiem tra drift cam bien");
                }
            }
        }
        catch (OperationCanceledException)
            when (stoppingToken.IsCancellationRequested)
        {
            // Service dang dung
        }
    }

    private async Task KiemTraDriftAsync(
        CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();

        var db = scope.ServiceProvider
            .GetRequiredService<Iot04DbContext>();

        var camBiens = await db.CamBiens
            .AsNoTracking()
            .Where(c => c.MaCamBien == Dht11Id ||
                        c.MaCamBien == Sht30Id)
            .ToListAsync(cancellationToken);

        var dht = camBiens.FirstOrDefault(
            c => c.MaCamBien == Dht11Id);

        var sht = camBiens.FirstOrDefault(
            c => c.MaCamBien == Sht30Id);

        if (dht == null || sht == null ||
            dht.MaVung != sht.MaVung ||
            dht.TrangThai != "DANG_HOAT_DONG" ||
            sht.TrangThai != "DANG_HOAT_DONG")
        {
            _soLanSaiLech = 0;
            return;
        }

        var duLieuDht = await db.DuLieuCamBiens
            .AsNoTracking()
            .Where(d => d.MaCamBien == Dht11Id)
            .OrderByDescending(d => d.MaDuLieu)
            .FirstOrDefaultAsync(cancellationToken);

        var duLieuSht = await db.DuLieuCamBiens
            .AsNoTracking()
            .Where(d => d.MaCamBien == Sht30Id)
            .OrderByDescending(d => d.MaDuLieu)
            .FirstOrDefaultAsync(cancellationToken);

        if (duLieuDht == null || duLieuSht == null)
            return;

        // Chi xu ly khi ca hai cam bien deu co mau moi
        if (duLieuDht.MaDuLieu <= _lastDhtDataId ||
            duLieuSht.MaDuLieu <= _lastShtDataId)
            return;

        _lastDhtDataId = duLieuDht.MaDuLieu;
        _lastShtDataId = duLieuSht.MaDuLieu;

        // Hai mau phai gan nhau ve thoi gian
        double khoangCachGiay = Math.Abs(
            (duLieuDht.ThoiGianGhiNhan -
             duLieuSht.ThoiGianGhiNhan).TotalSeconds);

        if (khoangCachGiay > 10)
        {
            _soLanSaiLech = 0;
            return;
        }

        // Khong so sanh mau cu
        var hienTai = DateTime.Now;

        if ((hienTai - duLieuDht.ThoiGianGhiNhan).TotalSeconds > 20 ||
            (hienTai - duLieuSht.ThoiGianGhiNhan).TotalSeconds > 20)
        {
            _soLanSaiLech = 0;
            return;
        }

        double lechNhietDo = Math.Abs(
            duLieuDht.NhietDo - duLieuSht.NhietDo);

        double lechDoAm = Math.Abs(
            duLieuDht.DoAm - duLieuSht.DoAm);

        bool nghiNgoDrift =
            lechNhietDo > NguongNhietDo ||
            lechDoAm > NguongDoAm;

        if (!nghiNgoDrift)
        {
            _soLanSaiLech = 0;
            return;
        }

        _soLanSaiLech++;

        _logger.LogWarning(
            "Nghi ngo drift: TempDiff={Temp:F2}, HumDiff={Hum:F2}, Count={Count}",
            lechNhietDo, lechDoAm, _soLanSaiLech);

        if (_soLanSaiLech < SoLanLienTiep)
            return;

        // Tranh tao canh bao trung
        bool daCoCanhBao = await db.NgoaiLes.AnyAsync(
            n => n.MaCamBien == Dht11Id &&
                 n.LoaiNgoaiLe == "NGHI_NGO_DRIFT" &&
                 n.TrangThai == "MOI",
            cancellationToken);

        if (daCoCanhBao)
            return;

        db.NgoaiLes.Add(new NgoaiLe
        {
            MaCamBien = Dht11Id,
            MaDuLieu = duLieuDht.MaDuLieu,
            LoaiNgoaiLe = "NGHI_NGO_DRIFT",
            MoTa =
                $"Phat hien sai lech giua DHT11 va SHT30. " +
                $"Chenh lech nhiet do: {lechNhietDo:F2} C, " +
                $"chenh lech do am: {lechDoAm:F2}%. " +
                $"Sai lech xuat hien {SoLanLienTiep} lan lien tiep.",
            ThoiGianPhatHien = hienTai,
            TrangThai = "MOI"
        });

        await db.SaveChangesAsync(cancellationToken);

        _logger.LogWarning(
            "Da tao canh bao NGHI_NGO_DRIFT");

        _soLanSaiLech = 0;
    }
}
