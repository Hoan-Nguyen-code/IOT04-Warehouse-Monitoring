
import api from './api';

export interface AuthUser {
  maTaiKhoan: number;
  tenDangNhap: string;
  vaiTro: 'ADMIN' | 'USER';
}

export interface LoginRequest {
  tenDangNhap: string;
  matKhau: string;
}

interface LoginResponse {
  message: string;
  user: AuthUser;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthUser> {
    const response = await api.post<LoginResponse>(
      '/auth/login',
      data
    );

    return response.data.user;
  },

  async me(): Promise<AuthUser> {
    const response = await api.get<AuthUser>('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
