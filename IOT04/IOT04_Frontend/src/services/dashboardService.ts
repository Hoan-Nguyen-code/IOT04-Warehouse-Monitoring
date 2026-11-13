
import api from './api';

import type {
  Vung,
  CamBien,
  DuLieuCamBien,
  NgoaiLe,
} from '../types/dashboard';

export const dashboardService = {
  async getVungs(): Promise<Vung[]> {
    const response = await api.get<Vung[]>('/vung');
    return response.data;
  },

  async getCamBiens(): Promise<CamBien[]> {
    const response = await api.get<CamBien[]>('/cambien');
    return response.data;
  },

  async getDuLieuCamBiens(): Promise<DuLieuCamBien[]> {
    const response = await api.get<DuLieuCamBien[]>(
      '/dulieucambien'
    );
    return response.data;
  },

  async getNgoaiLes(): Promise<NgoaiLe[]> {
    const response = await api.get<NgoaiLe[]>('/ngoaile');
    return response.data;
  },
};
