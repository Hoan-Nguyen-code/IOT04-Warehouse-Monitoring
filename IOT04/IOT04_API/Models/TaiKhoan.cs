
using System;
using System.Collections.Generic;

namespace IOT04_API.Models;

public partial class TaiKhoan
{
    public int MaTaiKhoan { get; set; }

    public string TenDangNhap { get; set; } = null!;

    public string MatKhauHash { get; set; } = null!;

    public string VaiTro { get; set; } = null!;

    public bool TrangThai { get; set; }

    public int? MaVung { get; set; }

    public virtual Vung? MaVungNavigation { get; set; }

    public virtual ICollection<CamBien> CamBiens { get; set; } = new List<CamBien>();

    public virtual ICollection<NgoaiLe> NgoaiLes { get; set; } = new List<NgoaiLe>();

    public virtual ICollection<Vung> Vungs { get; set; } = new List<Vung>();
}
