
using System.ComponentModel.DataAnnotations;

namespace IOT04_API.DTOs;

// Du lieu tra ve cho frontend
public class TaiKhoanResponse
{
    public int MaTaiKhoan { get; set; }

    public string TenDangNhap { get; set; } = string.Empty;

    public string VaiTro { get; set; } = string.Empty;

    public bool TrangThai { get; set; }

    // Ma vung kho duoc phan cong
    public int? MaVung { get; set; }

    // Ten vung kho de hien thi tren giao dien
    public string? TenVung { get; set; }
}

// Du lieu tao tai khoan moi
public class TaoTaiKhoanRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên đăng nhập")]
    [StringLength(50, MinimumLength = 3)]
    public string TenDangNhap { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu")]
    [StringLength(100, MinimumLength = 6)]
    public string MatKhau { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn vai trò")]
    public string VaiTro { get; set; } = "USER";

    // ADMIN chon vung kho khi tao USER
    public int? MaVung { get; set; }
}

// Du lieu chinh sua tai khoan
public class CapNhatTaiKhoanRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên đăng nhập")]
    [StringLength(50, MinimumLength = 3)]
    public string TenDangNhap { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn vai trò")]
    public string VaiTro { get; set; } = "USER";

    // ADMIN co the thay doi vung kho cua USER
    public int? MaVung { get; set; }
}

// Du lieu thay doi trang thai tai khoan
public class CapNhatTrangThaiTaiKhoanRequest
{
    public bool TrangThai { get; set; }
}
