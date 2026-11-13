
import { useNavigate } from 'react-router-dom';
import { LogOut, CircleUserRound } from 'lucide-react';
import { authService } from '../services/authService';
import type { AuthUser } from '../services/authService';

interface HeaderProps {
  user: AuthUser;
}

export default function Header({ user }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch {
      alert('Không thể đăng xuất. Vui lòng thử lại.');
    }
  };

  return (
    <header className="main-header">
      <div className="header-heading">
        <h2>Hệ thống theo dõi điều kiện kho</h2>
        <p>Giám sát nhiệt độ, độ ẩm và trạng thái cảm biến</p>
      </div>

      <div className="header-actions">
        <div className="header-user">
          <CircleUserRound size={30} />
          <div>
            <strong>{user.tenDangNhap}</strong>
            <span>{user.vaiTro}</span>
          </div>
        </div>

        <button
          type="button"
          className="header-logout"
          onClick={handleLogout}
          title="Đăng xuất"
        >
          <LogOut size={19} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
