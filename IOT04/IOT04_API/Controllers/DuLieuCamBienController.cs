
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IOT04_API.Data;
using IOT04_API.Models;
using IOT04_API.DTOs;
using System.Security.Claims;

namespace IOT04_API.Controllers
{
    [Route("api/dulieucambien")]
    [ApiController]
    [Authorize]
    public class DuLieuCamBienController : ControllerBase
    {
        private readonly Iot04DbContext _context;

        public DuLieuCamBienController(Iot04DbContext context)
        {
            _context = context;
        }

        // GET: api/dulieucambien
        // ADMIN xem tat ca du lieu
        // USER chi xem du lieu cam bien thuoc vung duoc phan cong
        [HttpGet]
        public async Task<IActionResult> GetDuLieu()
        {
            int? maTaiKhoan = LayMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized(new
                {
                    message = "Phiên đăng nhập không hợp lệ."
                });
            }

            var taiKhoan = await _context.TaiKhoans
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value &&
                    x.TrangThai);

            if (taiKhoan == null)
            {
                return Unauthorized(new
                {
                    message = "Tài khoản không tồn tại hoặc đã bị khóa."
                });
            }

            var query = _context.DuLieuCamBiens
                .AsNoTracking();

            if (taiKhoan.VaiTro == "USER")
            {
                if (!taiKhoan.MaVung.HasValue)
                {
                    return Ok(Array.Empty<object>());
                }

                int maVung = taiKhoan.MaVung.Value;

                query = query.Where(d =>
                    _context.CamBiens.Any(cb =>
                        cb.MaCamBien == d.MaCamBien &&
                        cb.MaVung == maVung));
            }
            else if (taiKhoan.VaiTro != "ADMIN")
            {
                return Forbid();
            }

            var danhSach = await query
                .OrderByDescending(d => d.ThoiGianGhiNhan)
                .Take(100)
                .Select(d => new
                {
                    d.MaDuLieu,
                    d.MaCamBien,
                    d.NhietDo,
                    d.DoAm,
                    d.ThoiGianGhiNhan
                })
                .ToListAsync();

            return Ok(danhSach);
        }

        // POST: api/dulieucambien
        // Tam thoi chi ADMIN duoc gui du lieu thu nghiem
        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ThemDuLieu(
            [FromBody] DuLieuCamBienRequest request)
        {
            int? maTaiKhoan = LayMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized(new
                {
                    message = "Phiên đăng nhập không hợp lệ."
                });
            }

            bool adminHopLe = await _context.TaiKhoans
                .AsNoTracking()
                .AnyAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value &&
                    x.TrangThai &&
                    x.VaiTro == "ADMIN");

            if (!adminHopLe)
            {
                return Forbid();
            }

            if (request.MaCamBien <= 0)
            {
                return BadRequest("Ma cam bien khong hop le.");
            }

            if (!double.IsFinite(request.NhietDo) ||
                request.NhietDo < -40 ||
                request.NhietDo > 80)
            {
                return BadRequest("Nhiet do khong hop le.");
            }

            if (!double.IsFinite(request.DoAm) ||
                request.DoAm < 0 ||
                request.DoAm > 100)
            {
                return BadRequest(
                    "Do am phai nam trong khoang 0-100.");
            }

            var camBien = await _context.CamBiens
                .FirstOrDefaultAsync(c =>
                    c.MaCamBien == request.MaCamBien);

            if (camBien == null)
            {
                return NotFound("Khong tim thay cam bien.");
            }

            // Lay nguong nhiet do va do am cua vung kho
            var vung = await _context.Vungs
                .AsNoTracking()
                .FirstOrDefaultAsync(v =>
                    v.MaVung == camBien.MaVung);

            if (vung == null)
            {
                return BadRequest(
                    "Cam bien chua duoc gan vao vung kho hop le.");
            }

            var thoiGian = DateTime.Now;

            var duLieu = new DuLieuCamBien
            {
                MaCamBien = request.MaCamBien,
                NhietDo = request.NhietDo,
                DoAm = request.DoAm,
                ThoiGianGhiNhan = thoiGian
            };

            _context.DuLieuCamBiens.Add(duLieu);

            camBien.TrangThai = "DANG_HOAT_DONG";
            camBien.ThoiDiemDuLieuCuoi = thoiGian;

            // Kiem tra nhiet do vuot nguong
            if (request.NhietDo < vung.NhietDoMin ||
                request.NhietDo > vung.NhietDoMax)
            {
                _context.NgoaiLes.Add(new NgoaiLe
                {
                    MaCamBien = camBien.MaCamBien,
                    MaDuLieuNavigation = duLieu,
                    LoaiNgoaiLe = "VUOT_NGUONG_NHIET_DO",
                    MoTa =
                        $"Nhiet do {request.NhietDo} C nam ngoai khoang " +
                        $"{vung.NhietDoMin} - {vung.NhietDoMax} C.",
                    ThoiGianPhatHien = thoiGian,
                    TrangThai = "MOI"
                });
            }

            // Kiem tra do am vuot nguong
            if (request.DoAm < vung.DoAmMin ||
                request.DoAm > vung.DoAmMax)
            {
                _context.NgoaiLes.Add(new NgoaiLe
                {
                    MaCamBien = camBien.MaCamBien,
                    MaDuLieuNavigation = duLieu,
                    LoaiNgoaiLe = "VUOT_NGUONG_DO_AM",
                    MoTa =
                        $"Do am {request.DoAm}% nam ngoai khoang " +
                        $"{vung.DoAmMin} - {vung.DoAmMax}%.",
                    ThoiGianPhatHien = thoiGian,
                    TrangThai = "MOI"
                });
            }

            // Luu du lieu, trang thai cam bien va canh bao
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Luu du lieu cam bien thanh cong.",
                duLieu.MaDuLieu,
                duLieu.MaCamBien,
                duLieu.NhietDo,
                duLieu.DoAm,
                duLieu.ThoiGianGhiNhan
            });
        }

        // Lay ma tai khoan tu Cookie Authentication
        private int? LayMaTaiKhoan()
        {
            string? id = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            return int.TryParse(id, out int maTaiKhoan)
                ? maTaiKhoan
                : null;
        }
    }
}
