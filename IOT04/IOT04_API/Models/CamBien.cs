using System;
using System.Collections.Generic;

namespace IOT04_API.Models;

public partial class CamBien
{
    public int MaCamBien { get; set; }

    public string TenCamBien { get; set; } = null!;

    public string TrangThai { get; set; } = null!;

    public DateTime? ThoiDiemDuLieuCuoi { get; set; }

    public int ChuKyGuiDuLieu { get; set; }

    public int NguongMatKetNoi { get; set; }

    public int MaVung { get; set; }

    public int MaTaiKhoan { get; set; }

    public string LoaiCamBien { get; set; } = null!;

    public string VaiTro { get; set; } = null!;

    public virtual ICollection<DuLieuCamBien> DuLieuCamBiens { get; set; } = new List<DuLieuCamBien>();

    public virtual TaiKhoan MaTaiKhoanNavigation { get; set; } = null!;

    public virtual Vung MaVungNavigation { get; set; } = null!;

    public virtual ICollection<NgoaiLe> NgoaiLes { get; set; } = new List<NgoaiLe>();
}
