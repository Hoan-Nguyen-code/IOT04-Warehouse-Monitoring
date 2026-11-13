
using IOT04_API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IOT04_API.Data;

public static class AdminSeeder
{
    public static async Task SeedAsync(
        IServiceProvider services,
        IConfiguration configuration)
    {
        var password = configuration["SeedAdmin:Password"];

        if (string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        using var scope = services.CreateScope();

        var db = scope.ServiceProvider
            .GetRequiredService<Iot04DbContext>();

        var hasher = scope.ServiceProvider
            .GetRequiredService<IPasswordHasher<TaiKhoan>>();

        var admin = await db.TaiKhoans
            .FirstOrDefaultAsync(x => x.TenDangNhap == "admin");

        if (admin == null)
        {
            throw new InvalidOperationException(
                "Khong tim thay tai khoan admin trong SQL Server.");
        }

        // Chỉ thay thế hash mẫu, không ghi đè mật khẩu hợp lệ.
        if (admin.MatKhauHash != "HASH_MAU_CHUA_HOP_LE")
        {
            return;
        }

        admin.MatKhauHash = hasher.HashPassword(admin, password);

        await db.SaveChangesAsync();

        Console.WriteLine("Da khoi tao mat khau ADMIN thanh cong.");
    }
}
