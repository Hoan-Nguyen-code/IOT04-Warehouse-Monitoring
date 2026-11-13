
using System.Security.Claims;
using IOT04_API.Data;
using IOT04_API.DTOs;
using IOT04_API.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IOT04_API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly Iot04DbContext _context;
    private readonly IPasswordHasher<TaiKhoan> _passwordHasher;

    public AuthController(
        Iot04DbContext context,
        IPasswordHasher<TaiKhoan> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    // POST: api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        var tenDangNhap = request.TenDangNhap.Trim();

        var taiKhoan = await _context.TaiKhoans
            .Include(x => x.MaVungNavigation)
            .FirstOrDefaultAsync(x =>
                x.TenDangNhap == tenDangNhap);

        if (taiKhoan == null || !taiKhoan.TrangThai)
        {
            return Unauthorized(new
            {
                message = "Tên đăng nhập hoặc mật khẩu không đúng"
            });
        }

        var result = _passwordHasher.VerifyHashedPassword(
            taiKhoan,
            taiKhoan.MatKhauHash,
            request.MatKhau
        );

        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new
            {
                message = "Tên đăng nhập hoặc mật khẩu không đúng"
            });
        }

        // Nang cap hash neu thuat toan yeu cau
        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            taiKhoan.MatKhauHash =
                _passwordHasher.HashPassword(
                    taiKhoan,
                    request.MatKhau
                );

            await _context.SaveChangesAsync();
        }

        var claims = new List<Claim>
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                taiKhoan.MaTaiKhoan.ToString()
            ),
            new Claim(
                ClaimTypes.Name,
                taiKhoan.TenDangNhap
            ),
            new Claim(
                ClaimTypes.Role,
                taiKhoan.VaiTro
            )
        };

        var identity = new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal
        );

        return Ok(new
        {
            message = "Đăng nhập thành công",
            user = new
            {
                maTaiKhoan = taiKhoan.MaTaiKhoan,
                tenDangNhap = taiKhoan.TenDangNhap,
                vaiTro = taiKhoan.VaiTro,
                maVung = taiKhoan.MaVung,
                tenVung = taiKhoan.MaVungNavigation?.TenVung
            }
        });
    }

    // POST: api/auth/logout
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        return Ok(new
        {
            message = "Đăng xuất thành công"
        });
    }

    // GET: api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var idText = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!int.TryParse(idText, out var id))
        {
            return Unauthorized(new
            {
                message = "Phiên đăng nhập không hợp lệ"
            });
        }

        var taiKhoan = await _context.TaiKhoans
            .AsNoTracking()
            .Include(x => x.MaVungNavigation)
            .FirstOrDefaultAsync(x =>
                x.MaTaiKhoan == id && x.TrangThai);

        if (taiKhoan == null)
        {
            return Unauthorized(new
            {
                message = "Tài khoản không tồn tại hoặc đã bị khóa"
            });
        }

        return Ok(new
        {
            maTaiKhoan = taiKhoan.MaTaiKhoan,
            tenDangNhap = taiKhoan.TenDangNhap,
            vaiTro = taiKhoan.VaiTro,
            maVung = taiKhoan.MaVung,
            tenVung = taiKhoan.MaVungNavigation?.TenVung
        });
    }
}
