
import api from './api';
import type { CamBien } from '../types/dashboard';

export interface CamBienRequest {
  tenCamBien: string;
  maVung: number;
  loaiCamBien: 'DHT11' | 'SHT30';
  vaiTro: 'CHINH' | 'THAM_CHIEU';
  chuKyGuiDuLieu: number;
  nguongMatKetNoi: number;
}

export const camBienService = {
  async getAll(): Promise<CamBien[]> {
    const response = await api.get<CamBien[]>('/cambien');
    return response.data;
  },

  async create(data: CamBienRequest): Promise<void> {
    await api.post('/cambien', data);
  },

  async update(id: number, data: CamBienRequest): Promise<void> {
    await api.put(`/cambien/${id}`, data);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/cambien/${id}`);
  },
};
