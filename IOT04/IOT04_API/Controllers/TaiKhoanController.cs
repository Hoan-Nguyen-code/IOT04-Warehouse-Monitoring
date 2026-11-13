
using System.Security.Claims;
using IOT04_API.Data;
using IOT04_API.DTOs;
using IOT04_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IOT04_API.Controllers;

[ApiController]
[Route("api/taikhoan")]
[Authorize(Roles = "ADMIN")]
public class TaiKhoanController : ControllerBase
{
    private readonly Iot04DbContext _context;
    private readonly IPasswordHasher<TaiKhoan> _passwordHasher;

    public TaiKhoanController(
        Iot04DbContext context,
        IPasswordHasher<TaiKhoan> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    // GET: api/taikhoan
    // Lay danh sach tai khoan va vung kho duoc phan cong
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var danhSach = await _context.TaiKhoans
            .AsNoTracking()
            .OrderBy(x => x.MaTaiKhoan)
            .Select(x => new TaiKhoanResponse
            {
                MaTaiKhoan = x.MaTaiKhoan,
                TenDangNhap = x.TenDangNhap,
                VaiTro = x.VaiTro,
                TrangThai = x.TrangThai,
                MaVung = x.MaVung,
                TenVung = x.MaVungNavigation != null
                    ? x.MaVungNavigation.TenVung
                    : null
            })
            .ToListAsync();

        return Ok(danhSach);
    }

    // POST: api/taikhoan
    // ADMIN tao tai khoan va phan cong vung kho
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] TaoTaiKhoanRequest request)
    {
        var tenDangNhap = request.TenDangNhap.Trim();
        var vaiTro = request.VaiTro.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(tenDangNhap))
        {
            return BadRequest(new
            {
                message = "Tên đăng nhập không được để trống"
            });
        }

        if (vaiTro != "ADMIN" && vaiTro != "USER")
        {
            return BadRequest(new
            {
                message = "Vai trò không hợp lệ"
            });
        }

        var daTonTai = await _context.TaiKhoans
            .AnyAsync(x => x.TenDangNhap == tenDangNhap);

        if (daTonTai)
        {
            return Conflict(new
            {
                message = "Tên đăng nhập đã tồn tại"
            });
        }

        // Chi USER moi duoc phan cong vung kho
        int? maVung = null;

        if (vaiTro == "USER" && request.MaVung.HasValue)
        {
            var vungTonTai = await _context.Vungs
                .AnyAsync(x => x.MaVung == request.MaVung.Value);

            if (!vungTonTai)
            {
                return BadRequest(new
                {
                    message = "Vùng kho được chọn không tồn tại"
                });
            }

            maVung = request.MaVung.Value;
        }

        var taiKhoan = new TaiKhoan
        {
            TenDangNhap = tenDangNhap,
            VaiTro = vaiTro,
            TrangThai = true,
            MaVung = maVung
        };

        taiKhoan.MatKhauHash = _passwordHasher.HashPassword(
            taiKhoan,
            request.MatKhau
        );

        _context.TaiKhoans.Add(taiKhoan);
        await _context.SaveChangesAsync();

        string? tenVung = null;

        if (taiKhoan.MaVung.HasValue)
        {
            tenVung = await _context.Vungs
                .Where(x => x.MaVung == taiKhoan.MaVung.Value)
                .Select(x => x.TenVung)
                .FirstOrDefaultAsync();
        }

        return StatusCode(201, new
        {
            message = "Tạo tài khoản thành công",
            taiKhoan = new TaiKhoanResponse
            {
                MaTaiKhoan = taiKhoan.MaTaiKhoan,
                TenDangNhap = taiKhoan.TenDangNhap,
                VaiTro = taiKhoan.VaiTro,
                TrangThai = taiKhoan.TrangThai,
                MaVung = taiKhoan.MaVung,
                TenVung = tenVung
            }
        });
    }

    // PUT: api/taikhoan/{id}
    // ADMIN sua tai khoan va thay doi vung kho
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] CapNhatTaiKhoanRequest request)
    {
        var taiKhoan = await _context.TaiKhoans
            .FirstOrDefaultAsync(x => x.MaTaiKhoan == id);

        if (taiKhoan == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy tài khoản"
            });
        }

        var tenDangNhap = request.TenDangNhap.Trim();
        var vaiTro = request.VaiTro.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(tenDangNhap))
        {
            return BadRequest(new
            {
                message = "Tên đăng nhập không được để trống"
            });
        }

        if (vaiTro != "ADMIN" && vaiTro != "USER")
        {
            return BadRequest(new
            {
                message = "Vai trò không hợp lệ"
            });
        }

        var trungTen = await _context.TaiKhoans
            .AnyAsync(x =>
                x.TenDangNhap == tenDangNhap &&
                x.MaTaiKhoan != id);

        if (trungTen)
        {
            return Conflict(new
            {
                message = "Tên đăng nhập đã tồn tại"
            });
        }

        var idHienTai = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (idHienTai == id.ToString())
        {
            if (vaiTro != "ADMIN")
            {
                return BadRequest(new
                {
                    message = "Không thể tự hạ quyền ADMIN"
                });
            }

            if (tenDangNhap != taiKhoan.TenDangNhap)
            {
                return BadRequest(new
                {
                    message =
                        "Không thể đổi tên đăng nhập của tài khoản đang sử dụng"
                });
            }
        }

        // Kiem tra va cap nhat vung kho cho USER
        int? maVung = null;

        if (vaiTro == "USER" && request.MaVung.HasValue)
        {
            var vungTonTai = await _context.Vungs
                .AnyAsync(x => x.MaVung == request.MaVung.Value);

            if (!vungTonTai)
            {
                return BadRequest(new
                {
                    message = "Vùng kho được chọn không tồn tại"
                });
            }

            maVung = request.MaVung.Value;
        }

        taiKhoan.TenDangNhap = tenDangNhap;
        taiKhoan.VaiTro = vaiTro;
        taiKhoan.MaVung = maVung;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật tài khoản thành công"
        });
    }

    // PUT: api/taikhoan/{id}/trangthai
    // ADMIN khoa hoac mo khoa tai khoan
    [HttpPut("{id:int}/trangthai")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] CapNhatTrangThaiTaiKhoanRequest request)
    {
        var taiKhoan = await _context.TaiKhoans
            .FirstOrDefaultAsync(x => x.MaTaiKhoan == id);

        if (taiKhoan == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy tài khoản"
            });
        }

        var idHienTai = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (idHienTai == id.ToString() && !request.TrangThai)
        {
            return BadRequest(new
            {
                message = "Không thể tự khóa tài khoản đang đăng nhập"
            });
        }

        taiKhoan.TrangThai = request.TrangThai;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = request.TrangThai
                ? "Mở khóa tài khoản thành công"
                : "Khóa tài khoản thành công"
        });
    }
}
