
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VungKho from "./pages/VungKho";
import CamBien from "./pages/CamBien";
import LichSu from "./pages/LichSu";
import CanhBao from "./pages/CanhBao";
import SoSanhCamBien from "./pages/SoSanhCamBien";
import TaiKhoan from "./pages/TaiKhoan";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

import { authService } from "./services/authService";

// Route chi danh cho ADMIN
function AdminRoute({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authService
      .me()
      .then((user) => {
        if (active) {
          setRole(user.vaiTro);
        }
      })
      .catch(() => {
        if (active) {
          setRole(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="layout-loading">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/vung-kho" element={<VungKho />} />

          <Route path="/cam-bien" element={<CamBien />} />

          <Route path="/lich-su" element={<LichSu />} />

          <Route path="/canh-bao" element={<CanhBao />} />

          <Route
            path="/so-sanh-cam-bien"
            element={<SoSanhCamBien />}
          />

          <Route
            path="/tai-khoan"
            element={
              <AdminRoute>
                <TaiKhoan />
              </AdminRoute>
            }
          />
        </Route>

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
