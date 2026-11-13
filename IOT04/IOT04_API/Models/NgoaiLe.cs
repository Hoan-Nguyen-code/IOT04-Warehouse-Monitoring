using System;
using System.Collections.Generic;

namespace IOT04_API.Models;

public partial class NgoaiLe
{
    public long MaNgoaiLe { get; set; }

    public int MaCamBien { get; set; }

    public long? MaDuLieu { get; set; }

    public int? MaTaiKhoan { get; set; }

    public string LoaiNgoaiLe { get; set; } = null!;

    public string? MoTa { get; set; }

    public DateTime ThoiGianPhatHien { get; set; }

    public string TrangThai { get; set; } = null!;

    public virtual CamBien MaCamBienNavigation { get; set; } = null!;

    public virtual DuLieuCamBien? MaDuLieuNavigation { get; set; }

    public virtual TaiKhoan? MaTaiKhoanNavigation { get; set; }
}
