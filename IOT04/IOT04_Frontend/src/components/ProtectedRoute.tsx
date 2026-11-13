
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Array<'ADMIN' | 'USER'>;
}

export default function ProtectedRoute({
  children,
  roles,
}: ProtectedRouteProps) {
  const [status, setStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated' | 'forbidden'
  >('loading');

  useEffect(() => {
    let active = true;

    authService.me()
      .then((user) => {
        if (!active) return;

        if (roles && !roles.includes(user.vaiTro)) {
          setStatus('forbidden');
        } else {
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (active) setStatus('unauthenticated');
      });

    return () => {
      active = false;
    };
  }, [roles]);

  if (status === 'loading') {
    return <p style={{ padding: 24 }}>Đang kiểm tra đăng nhập...</p>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'forbidden') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
