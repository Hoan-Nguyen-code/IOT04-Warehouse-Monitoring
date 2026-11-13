
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IOT04_API.Data;
using IOT04_API.DTOs;
using IOT04_API.Models;
using System.Security.Claims;

namespace IOT04_API.Controllers
{
    [Route("api/vung")]
    [ApiController]
    [Authorize]
    public class VungController : ControllerBase
    {
        private readonly Iot04DbContext _context;

        public VungController(Iot04DbContext context)
        {
            _context = context;
        }

        // GET: api/vung
        // ADMIN xem tat ca, USER chi xem vung duoc phan cong
        [HttpGet]
        public async Task<IActionResult> GetVung()
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

            var query = _context.Vungs.AsNoTracking();

            if (taiKhoan.VaiTro == "USER")
            {
                if (!taiKhoan.MaVung.HasValue)
                {
                    return Ok(new List<Vung>());
                }

                query = query.Where(x =>
                    x.MaVung == taiKhoan.MaVung.Value);
            }
            else if (taiKhoan.VaiTro != "ADMIN")
            {
                return Forbid();
            }

            var danhSach = await query.ToListAsync();

            return Ok(danhSach);
        }

        // POST: api/vung
        // Chi ADMIN duoc them vung kho
        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> CreateVung(
            [FromBody] VungRequest request)
        {
            if (!KiemTraNguong(request))
            {
                return BadRequest(new
                {
                    message = "Ngưỡng nhiệt độ hoặc độ ẩm không hợp lệ."
                });
            }

            int? maTaiKhoan = LayMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized();
            }

            var adminHopLe = await _context.TaiKhoans
                .AsNoTracking()
                .AnyAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value &&
                    x.TrangThai &&
                    x.VaiTro == "ADMIN");

            if (!adminHopLe)
            {
                return Forbid();
            }

            var vung = new Vung
            {
                TenVung = request.TenVung.Trim(),
                MoTa = request.MoTa,
                NhietDoMin = request.NhietDoMin!.Value,
                NhietDoMax = request.NhietDoMax!.Value,
                DoAmMin = request.DoAmMin!.Value,
                DoAmMax = request.DoAmMax!.Value,
                MaTaiKhoan = maTaiKhoan.Value
            };

            _context.Vungs.Add(vung);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm vùng kho thành công.",
                maVung = vung.MaVung
            });
        }

        // PUT: api/vung/{id}
        // Chi ADMIN duoc cap nhat vung kho
        [HttpPut("{id:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> UpdateVung(
            int id,
            [FromBody] VungRequest request)
        {
            if (!KiemTraNguong(request))
            {
                return BadRequest(new
                {
                    message = "Ngưỡng nhiệt độ hoặc độ ẩm không hợp lệ."
                });
            }

            int? maTaiKhoan = LayMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized();
            }

            var adminHopLe = await _context.TaiKhoans
                .AsNoTracking()
                .AnyAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value &&
                    x.TrangThai &&
                    x.VaiTro == "ADMIN");

            if (!adminHopLe)
            {
                return Forbid();
            }

            var vung = await _context.Vungs
                .FirstOrDefaultAsync(x => x.MaVung == id);

            if (vung == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy vùng kho."
                });
            }

            vung.TenVung = request.TenVung.Trim();
            vung.MoTa = request.MoTa;
            vung.NhietDoMin = request.NhietDoMin!.Value;
            vung.NhietDoMax = request.NhietDoMax!.Value;
            vung.DoAmMin = request.DoAmMin!.Value;
            vung.DoAmMax = request.DoAmMax!.Value;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật vùng kho thành công."
            });
        }

        // DELETE: api/vung/{id}
        // Chi ADMIN duoc xoa vung kho
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> DeleteVung(int id)
        {
            int? maTaiKhoan = LayMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized();
            }

            var adminHopLe = await _context.TaiKhoans
                .AsNoTracking()
                .AnyAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value &&
                    x.TrangThai &&
                    x.VaiTro == "ADMIN");

            if (!adminHopLe)
            {
                return Forbid();
            }

            var vung = await _context.Vungs
                .FirstOrDefaultAsync(x => x.MaVung == id);

            if (vung == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy vùng kho."
                });
            }

            bool coCamBien = await _context.CamBiens
                .AnyAsync(x => x.MaVung == id);

            if (coCamBien)
            {
                return Conflict(new
                {
                    message = "Không thể xóa vùng kho đang có cảm biến."
                });
            }

            // Khong xoa vung dang duoc phan cong cho USER
            bool coTaiKhoanPhuTrach = await _context.TaiKhoans
                .AnyAsync(x => x.MaVung == id);

            if (coTaiKhoanPhuTrach)
            {
                return Conflict(new
                {
                    message =
                        "Không thể xóa vùng kho đang được phân công cho tài khoản."
                });
            }

            _context.Vungs.Remove(vung);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa vùng kho thành công."
            });
        }

        // Kiem tra nguong nhiet do va do am
        private static bool KiemTraNguong(VungRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TenVung))
                return false;

            if (!request.NhietDoMin.HasValue ||
                !request.NhietDoMax.HasValue ||
                !request.DoAmMin.HasValue ||
                !request.DoAmMax.HasValue)
                return false;

            double nhietDoMin = request.NhietDoMin.Value;
            double nhietDoMax = request.NhietDoMax.Value;
            double doAmMin = request.DoAmMin.Value;
            double doAmMax = request.DoAmMax.Value;

            return
                double.IsFinite(nhietDoMin) &&
                double.IsFinite(nhietDoMax) &&
                double.IsFinite(doAmMin) &&
                double.IsFinite(doAmMax) &&
                nhietDoMin < nhietDoMax &&
                doAmMin >= 0 &&
                doAmMax <= 100 &&
                doAmMin < doAmMax;
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
