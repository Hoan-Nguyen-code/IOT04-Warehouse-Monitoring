
using IOT04_API.Data;
using IOT04_API.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using IOT04_API.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Kết nối SQL Server
builder.Services.AddDbContext<Iot04DbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// 2. Đăng ký PasswordHasher
builder.Services.AddScoped<IPasswordHasher<TaiKhoan>,
    PasswordHasher<TaiKhoan>>();

// 3. Cấu hình CORS cho React
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 4. Cấu hình Cookie Authentication
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "IOT04.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;

        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;

        // API trả về 401/403 thay vì redirect sang trang HTML
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

// 5. Controllers và OpenAPI
builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
// MQTT Subscriber - tu dong nhan du lieu ESP32
builder.Services.AddHostedService<MqttSubscriberService>();
builder.Services.AddHostedService<SensorConnectionMonitorService>();
builder.Services.AddHostedService<SensorDriftMonitorService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    await AdminSeeder.SeedAsync(app.Services, app.Configuration);
    app.MapOpenApi();
}

// 6. Middleware
app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("ReactFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
