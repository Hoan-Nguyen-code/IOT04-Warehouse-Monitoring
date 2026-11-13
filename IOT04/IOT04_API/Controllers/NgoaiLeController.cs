
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IOT04_API.Data;
using System.Security.Claims;

namespace IOT04_API.Controllers
{
    [Route("api/ngoaile")]
    [ApiController]
    [Authorize]
    public class NgoaiLeController : ControllerBase
    {
        private readonly Iot04DbContext _context;

        public NgoaiLeController(Iot04DbContext context)
        {
            _context = context;
        }

        // GET: api/ngoaile
        // ADMIN xem tat ca canh bao
        // USER chi xem canh bao cua vung kho duoc phan cong
        [HttpGet]
        public async Task<IActionResult> GetNgoaiLe()
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

            var query = _context.NgoaiLes.AsNoTracking();

            if (taiKhoan.VaiTro == "USER")
            {
                if (!taiKhoan.MaVung.HasValue)
                {
                    return Ok(Array.Empty<object>());
                }

                int maVung = taiKhoan.MaVung.Value;

                query = query.Where(n =>
                    _context.CamBiens.Any(cb =>
                        cb.MaCamBien == n.MaCamBien &&
                        cb.MaVung == maVung));
            }
            else if (taiKhoan.VaiTro != "ADMIN")
            {
                return Forbid();
            }

            var danhSach = await query
                .OrderByDescending(n => n.ThoiGianPhatHien)
                .Take(100)
                .Select(n => new
                {
                    n.MaNgoaiLe,
                    n.MaCamBien,
                    n.MaDuLieu,
                    n.LoaiNgoaiLe,
                    n.MoTa,
                    n.ThoiGianPhatHien,
                    n.TrangThai
                })
                .ToListAsync();

            return Ok(danhSach);
        }

        // PUT: api/ngoaile/{id}/trangthai
        // Chi ADMIN duoc danh dau canh bao da xu ly
        [HttpPut("{id:int}/trangthai")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> CapNhatTrangThai(int id)
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

            var ngoaiLe = await _context.NgoaiLes
                .FirstOrDefaultAsync(n => n.MaNgoaiLe == id);

            if (ngoaiLe == null)
            {
                return NotFound(new
                {
                    message = "Khong tim thay canh bao."
                });
            }

            if (ngoaiLe.TrangThai == "DA_XU_LY")
            {
                return BadRequest(new
                {
                    message = "Canh bao nay da duoc xu ly."
                });
            }

            if (ngoaiLe.TrangThai != "MOI")
            {
                return BadRequest(new
                {
                    message = "Trang thai canh bao khong hop le."
                });
            }

            ngoaiLe.TrangThai = "DA_XU_LY";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cap nhat trang thai canh bao thanh cong.",
                ngoaiLe.MaNgoaiLe,
                ngoaiLe.TrangThai
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
