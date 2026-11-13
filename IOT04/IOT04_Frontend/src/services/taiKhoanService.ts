
import api from "./api";

export interface TaiKhoan {
  maTaiKhoan: number;
  tenDangNhap: string;
  vaiTro: string;
  trangThai: boolean;

  // Vung kho duoc phan cong
  maVung: number | null;
  tenVung: string | null;
}

export interface TaoTaiKhoanRequest {
  tenDangNhap: string;
  matKhau: string;
  vaiTro: string;

  // ADMIN chon vung kho cho USER
  maVung: number | null;
}

export interface CapNhatTaiKhoanRequest {
  tenDangNhap: string;
  vaiTro: string;

  // ADMIN co the thay doi vung kho
  maVung: number | null;
}

export const taiKhoanService = {
  // Lay danh sach tai khoan
  async getAll(): Promise<TaiKhoan[]> {
    const response = await api.get<TaiKhoan[]>("/taikhoan");
    return response.data;
  },

  // Tao tai khoan va phan cong vung kho
  async create(data: TaoTaiKhoanRequest): Promise<void> {
    await api.post("/taikhoan", data);
  },

  // Cap nhat tai khoan va vung kho
  async update(
    id: number,
    data: CapNhatTaiKhoanRequest
  ): Promise<void> {
    await api.put(`/taikhoan/${id}`, data);
  },

  // Khoa hoac mo khoa tai khoan
  async updateStatus(
    id: number,
    trangThai: boolean
  ): Promise<void> {
    await api.put(`/taikhoan/${id}/trangthai`, {
      trangThai,
    });
  },
};
