
import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { authService } from '../services/authService';
import type { AuthUser } from '../services/authService';
import '../styles/layout.css';

export default function MainLayout() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authService.me()
      .then((data) => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="layout-loading">Đang tải hệ thống...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="main-layout">
      <Sidebar role={user.vaiTro} />

      <div className="main-workspace">
        <Header user={user} />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
