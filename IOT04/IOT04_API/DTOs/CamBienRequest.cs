
using System.ComponentModel.DataAnnotations;

namespace IOT04_API.DTOs;

public class CamBienRequest
{
    [Required(ErrorMessage = "Tên cảm biến không được để trống.")]
    [StringLength(100)]
    public string TenCamBien { get; set; } = string.Empty;

    [Required]
    public int? MaVung { get; set; }

    [Required]
    [RegularExpression("^(DHT11|SHT30)$")]
    public string LoaiCamBien { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(CHINH|THAM_CHIEU)$")]
    public string VaiTro { get; set; } = string.Empty;

    [Required]
    [Range(1, 86400)]
    public int? ChuKyGuiDuLieu { get; set; }

    [Required]
    [Range(1, 86400)]
    public int? NguongMatKetNoi { get; set; }
}
