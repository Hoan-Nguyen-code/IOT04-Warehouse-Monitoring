
using System.ComponentModel.DataAnnotations;

namespace IOT04_API.DTOs;

public class VungRequest
{
    [Required]
    [StringLength(100)]
    public string TenVung { get; set; } = string.Empty;

    [StringLength(500)]
    public string? MoTa { get; set; }

    [Required]
    public double? NhietDoMin { get; set; }

    [Required]
    public double? NhietDoMax { get; set; }

    [Required]
    public double? DoAmMin { get; set; }

    [Required]
    public double? DoAmMax { get; set; }
}
