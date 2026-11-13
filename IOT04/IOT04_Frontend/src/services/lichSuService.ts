
import api from './api';
import type {
  DuLieuCamBien,
  CamBien,
  Vung,
} from '../types/dashboard';

export const lichSuService = {
  async getDuLieu(): Promise<DuLieuCamBien[]> {
    const response = await api.get<DuLieuCamBien[]>(
      '/dulieucambien'
    );
    return response.data;
  },

  async getCamBien(): Promise<CamBien[]> {
    const response = await api.get<CamBien[]>('/cambien');
    return response.data;
  },

  async getVung(): Promise<Vung[]> {
    const response = await api.get<Vung[]>('/vung');
    return response.data;
  },
};
