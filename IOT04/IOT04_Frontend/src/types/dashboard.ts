
export interface Vung {
  maVung: number;
  tenVung: string;
  moTa: string | null;
  nhietDoMin: number;
  nhietDoMax: number;
  doAmMin: number;
  doAmMax: number;
}

export interface CamBien {
  maCamBien: number;
  tenCamBien: string;
  trangThai: string;
  thoiDiemDuLieuCuoi: string | null;
  chuKyGuiDuLieu: number;
  nguongMatKetNoi: number;
  maVung: number;
  loaiCamBien: string;
  vaiTro: string;
}

export interface DuLieuCamBien {
  maDuLieu: number;
  maCamBien: number;
  nhietDo: number;
  doAm: number;
  thoiGianGhiNhan: string;
}

export interface NgoaiLe {
  maNgoaiLe: number;
  maCamBien: number;
  maDuLieu: number | null;
  loaiNgoaiLe: string;
  moTa: string | null;
  thoiGianPhatHien: string;
  trangThai: string;
}
