
import api from './api';
import type { Vung } from '../types/dashboard';

export interface VungRequest {
  tenVung: string;
  moTa: string;
  nhietDoMin: number;
  nhietDoMax: number;
  doAmMin: number;
  doAmMax: number;
}

export const vungKhoService = {
  async getAll(): Promise<Vung[]> {
    const response = await api.get<Vung[]>('/vung');
    return response.data;
  },

  async create(data: VungRequest): Promise<void> {
    await api.post('/vung', data);
  },

  async update(id: number, data: VungRequest): Promise<void> {
    await api.put(`/vung/${id}`, data);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/vung/${id}`);
  },
};
