
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Warehouse, UserRound, LockKeyhole } from 'lucide-react';
import { authService } from '../services/authService';
import '../styles/login.css';

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      await authService.login({
        tenDangNhap: username.trim(),
        matKhau: password,
      });

      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          setError('Tên đăng nhập hoặc mật khẩu không đúng.');
        } else {
          setError('Không thể đăng nhập. Vui lòng kiểm tra Backend.');
        }
      } else {
        setError('Đã xảy ra lỗi không xác định.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Warehouse size={32} />
        </div>

        <h1 className="login-title">IOT-04</h1>

        <p className="login-subtitle">
          Hệ thống theo dõi điều kiện kho bằng cảm biến
        </p>

        <form className="login-form" onSubmit={handleLogin}>
          <label className="login-label" htmlFor="username">
            Tên đăng nhập
          </label>

          <div className="login-input-group">
            <UserRound size={18} />
            <input
              id="username"
              className="login-input"
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <label className="login-label" htmlFor="password">
            Mật khẩu
          </label>

          <div className="login-input-group">
            <LockKeyhole size={18} />
            <input
              id="password"
              className="login-input"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p role="alert" style={{ color: '#f87171', fontSize: 13 }}>
              {error}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="login-footer">
          © 2026 IOT-04 • Warehouse Monitoring System
        </p>
      </div>
    </div>
  );
}
