using System;
using System.Collections.Generic;

namespace IOT04_API.Models;

public partial class DuLieuCamBien
{
    public long MaDuLieu { get; set; }

    public int MaCamBien { get; set; }

    public double NhietDo { get; set; }

    public double DoAm { get; set; }

    public DateTime ThoiGianGhiNhan { get; set; }

    public virtual CamBien MaCamBienNavigation { get; set; } = null!;

    public virtual ICollection<NgoaiLe> NgoaiLes { get; set; } = new List<NgoaiLe>();
}
