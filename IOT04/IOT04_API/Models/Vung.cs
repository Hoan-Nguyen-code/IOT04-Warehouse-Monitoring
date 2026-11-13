using System;
using System.Collections.Generic;

namespace IOT04_API.Models;

public partial class Vung
{
    public int MaVung { get; set; }

    public string TenVung { get; set; } = null!;

    public string? MoTa { get; set; }

    public double NhietDoMin { get; set; }

    public double NhietDoMax { get; set; }

    public double DoAmMin { get; set; }

    public double DoAmMax { get; set; }

    public int MaTaiKhoan { get; set; }

    public virtual ICollection<CamBien> CamBiens { get; set; } = new List<CamBien>();

    public virtual TaiKhoan MaTaiKhoanNavigation { get; set; } = null!;
}
