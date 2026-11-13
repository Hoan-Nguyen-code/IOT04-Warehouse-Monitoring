
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Warehouse,
  Cpu,
  History,
  Bell,
  GitCompareArrows,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'USER';
}

export default function Sidebar({ role }: SidebarProps) {
  const menuItems = [
    { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/vung-kho', label: 'Vùng kho', icon: Warehouse },
    { path: '/cam-bien', label: 'Cảm biến', icon: Cpu },
    { path: '/lich-su', label: 'Lịch sử dữ liệu', icon: History },
    { path: '/canh-bao', label: 'Cảnh báo', icon: Bell },
    {
      path: '/so-sanh-cam-bien',
      label: 'So sánh cảm biến',
      icon: GitCompareArrows,
    },
  ];

  return (
    <aside className="main-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Warehouse size={25} />
        </div>
        <div>
          <strong>IOT-04</strong>
          <span>Warehouse Monitoring</span>
        </div>
      </div>

      <div className="sidebar-section-title">QUẢN LÝ HỆ THỐNG</div>

      <nav className="sidebar-nav">
        {menuItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}

        {role === 'ADMIN' && (
          <>
            <div className="sidebar-section-title sidebar-section-extra">
              QUẢN TRỊ
            </div>

            <NavLink
              to="/tai-khoan"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              <Users size={19} />
              <span>Quản lý tài khoản</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <ShieldCheck size={17} />
        <span>Hệ thống giám sát kho</span>
      </div>
    </aside>
  );
}
