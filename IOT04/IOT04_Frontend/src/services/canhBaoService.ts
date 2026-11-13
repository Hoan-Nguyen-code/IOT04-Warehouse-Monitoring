
import api from './api';
import type { NgoaiLe } from '../types/dashboard';

export const canhBaoService = {
  async getAll(): Promise<NgoaiLe[]> {
    const response = await api.get<NgoaiLe[]>('/ngoaile');
    return response.data;
  },

  async capNhatTrangThai(id: number): Promise<void> {
    await api.put(`/ngoaile/${id}/trangthai`);
  },
};
