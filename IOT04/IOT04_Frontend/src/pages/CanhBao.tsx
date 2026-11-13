
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  RefreshCw,
  Search,
} from "lucide-react";

import axios from "axios";

import { canhBaoService } from "../services/canhBaoService";
import { camBienService } from "../services/camBienService";
import { authService } from "../services/authService";

import type { CamBien, NgoaiLe } from "../types/dashboard";

import "../styles/canhbao.css";

type CanhBaoRow = NgoaiLe & {
  tenCamBien: string;
};

// Hien thi ten loai canh bao
function hienThiLoai(loai: string): string {
  switch (loai) {
    case "VUOT_NGUONG_NHIET_DO":
      return "Vượt ngưỡng nhiệt độ";

    case "VUOT_NGUONG_DO_AM":
      return "Vượt ngưỡng độ ẩm";

    case "MAT_KET_NOI":
      return "Mất kết nối";

    case "NGHI_NGO_DRIFT":
      return "Nghi ngờ drift";

    default:
      return loai;
  }
}

// Dinh dang thoi gian
function hienThiThoiGian(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Không xác định"
    : date.toLocaleString("vi-VN");
}

// Lay thong bao loi tu Backend
function layLoi(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (error.response?.status === 401) {
      return "Phiên đăng nhập đã hết hạn.";
    }

    if (error.response?.status === 403) {
      return "Tài khoản không có quyền xử lý cảnh báo.";
    }
  }

  return "Không thể thực hiện thao tác. Vui lòng thử lại.";
}

export default function CanhBao() {
  const [danhSach, setDanhSach] = useState<CanhBaoRow[]>([]);
  const [danhSachCamBien, setDanhSachCamBien] = useState<CamBien[]>([]);

  const [laAdmin, setLaAdmin] = useState(false);
  const [dangTai, setDangTai] = useState(true);
  const [dangLamMoi, setDangLamMoi] = useState(false);

  const [maDangXuLy, setMaDangXuLy] = useState<number | null>(null);

  const [loi, setLoi] = useState("");
  const [thanhCong, setThanhCong] = useState("");

  const [tuKhoa, setTuKhoa] = useState("");
  const [locCamBien, setLocCamBien] = useState("all");
  const [locLoai, setLocLoai] = useState("all");
  const [locTrangThai, setLocTrangThai] = useState("all");

  // Ngan cac request tai du lieu chong nhau
  const dangYeuCauRef = useRef(false);

  // Ngan polling khi ADMIN dang xu ly canh bao
  const dangXuLyRef = useRef(false);

  // Kiem tra component con duoc hien thi hay khong
  const mountedRef = useRef(false);

  // Tai danh sach canh bao va cam bien
  const taiDuLieu = useCallback(
    async (hienLoading = false, lamMoiThuCong = false) => {
      if (dangYeuCauRef.current || dangXuLyRef.current) {
        return;
      }

      dangYeuCauRef.current = true;

      if (hienLoading) {
        setDangTai(true);
      }

      if (lamMoiThuCong) {
        setDangLamMoi(true);
      }

      try {
        const [canhBao, camBien] = await Promise.all([
          canhBaoService.getAll(),
          camBienService.getAll(),
        ]);

        if (!mountedRef.current) return;

        const danhSachMoi: CanhBaoRow[] = canhBao.map(
          (item) => ({
            ...item,
            tenCamBien:
              camBien.find(
                (cb) => cb.maCamBien === item.maCamBien
              )?.tenCamBien ??
              `Cảm biến #${item.maCamBien}`,
          })
        );

        setDanhSachCamBien(camBien);
        setDanhSach(danhSachMoi);
        setLoi("");
      } catch (error) {
        if (mountedRef.current) {
          setLoi(layLoi(error));
        }
      } finally {
        dangYeuCauRef.current = false;

        if (mountedRef.current) {
          setDangTai(false);
          setDangLamMoi(false);
        }
      }
    },
    []
  );

  // Khoi tao va tu dong cap nhat moi 5 giay
  useEffect(() => {
    mountedRef.current = true;

    void taiDuLieu(true);

    authService
      .me()
      .then((user) => {
        if (mountedRef.current) {
          setLaAdmin(user.vaiTro === "ADMIN");
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setLaAdmin(false);
        }
      });

    const interval = window.setInterval(() => {
      if (!document.hidden && !dangXuLyRef.current) {
        void taiDuLieu();
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [taiDuLieu]);

  // Loc danh sach canh bao
  const danhSachLoc = useMemo(() => {
    const keyword = tuKhoa.trim().toLowerCase();

    return danhSach.filter((item) => {
      if (
        locCamBien !== "all" &&
        item.maCamBien !== Number(locCamBien)
      ) {
        return false;
      }

      if (
        locLoai !== "all" &&
        item.loaiNgoaiLe !== locLoai
      ) {
        return false;
      }

      if (
        locTrangThai !== "all" &&
        item.trangThai !== locTrangThai
      ) {
        return false;
      }

      if (
        keyword &&
        ![
          String(item.maNgoaiLe),
          item.tenCamBien,
          item.loaiNgoaiLe,
          hienThiLoai(item.loaiNgoaiLe),
          item.moTa ?? "",
        ].some((value) =>
          value.toLowerCase().includes(keyword)
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    danhSach,
    tuKhoa,
    locCamBien,
    locLoai,
    locTrangThai,
  ]);

  // Thong ke canh bao
  const tongCanhBao = danhSach.length;

  const soCanhBaoMoi = danhSach.filter(
    (item) => item.trangThai === "MOI"
  ).length;

  const soDaXuLy = danhSach.filter(
    (item) => item.trangThai === "DA_XU_LY"
  ).length;

  // Danh sach loai canh bao
  const danhSachLoai = Array.from(
    new Set(danhSach.map((item) => item.loaiNgoaiLe))
  );

  // Xoa bo loc
  function xoaBoLoc() {
    setTuKhoa("");
    setLocCamBien("all");
    setLocLoai("all");
    setLocTrangThai("all");
  }

  // ADMIN danh dau canh bao da xu ly
  async function danhDauDaXuLy(item: CanhBaoRow) {
    if (
      !laAdmin ||
      dangXuLyRef.current ||
      dangYeuCauRef.current ||
      dangTai
    ) {
      return;
    }

    if (item.trangThai !== "MOI") {
      return;
    }

    const dongY = window.confirm(
      `Xác nhận đã xử lý cảnh báo #${item.maNgoaiLe}?`
    );

    if (!dongY) return;

    dangXuLyRef.current = true;

    setMaDangXuLy(item.maNgoaiLe);
    setLoi("");
    setThanhCong("");

    try {
      await canhBaoService.capNhatTrangThai(
        item.maNgoaiLe
      );

      if (!mountedRef.current) return;

      // Cap nhat ngay trang thai tren giao dien
      setDanhSach((prev) =>
        prev.map((canhBao) =>
          canhBao.maNgoaiLe === item.maNgoaiLe
            ? {
                ...canhBao,
                trangThai: "DA_XU_LY",
              }
            : canhBao
        )
      );

      setThanhCong(
        `Đã cập nhật cảnh báo #${item.maNgoaiLe} thành công.`
      );
    } catch (error) {
      if (mountedRef.current) {
        setLoi(layLoi(error));
      }
    } finally {
      dangXuLyRef.current = false;

      if (mountedRef.current) {
        setMaDangXuLy(null);
      }
    }

    // Dong bo lai du lieu voi SQL Server
    if (mountedRef.current) {
      await taiDuLieu();
    }
  }

  return (
    <div className="canhbao-page">
      {/* Tieu de trang */}
      <div className="canhbao-header">
        <div>
          <h1>Quản lý cảnh báo</h1>

          <p>
            Theo dõi và xử lý các cảnh báo phát sinh
            từ cảm biến trong kho.
          </p>
        </div>

        <button
          type="button"
          className="canhbao-btn canhbao-btn-primary"
          onClick={() => void taiDuLieu(false, true)}
          disabled={
            dangTai ||
            dangLamMoi ||
            maDangXuLy !== null
          }
        >
          <RefreshCw size={17} />
          {dangLamMoi ? "Đang làm mới..." : "Làm mới"}
        </button>
      </div>

      {/* Thong bao loi */}
      {loi && (
        <div className="canhbao-error">
          {loi}
        </div>
      )}

      {/* Thong bao thanh cong */}
      {thanhCong && (
        <div className="canhbao-success">
          {thanhCong}
        </div>
      )}

      {/* Thong ke */}
      <div className="canhbao-stats">
        <div className="canhbao-stat">
          <Bell size={24} />

          <div>
            <span>Tổng cảnh báo</span>
            <strong>{tongCanhBao}</strong>
          </div>
        </div>

        <div className="canhbao-stat">
          <AlertTriangle size={24} />

          <div>
            <span>Cảnh báo mới</span>
            <strong>{soCanhBaoMoi}</strong>
          </div>
        </div>

        <div className="canhbao-stat">
          <CheckCircle2 size={24} />

          <div>
            <span>Đã xử lý</span>
            <strong>{soDaXuLy}</strong>
          </div>
        </div>
      </div>

      {/* Bo loc */}
      <section className="canhbao-panel">
        <div className="canhbao-panel-title">
          <h2>Bộ lọc cảnh báo</h2>

          <button
            type="button"
            className="canhbao-btn canhbao-btn-secondary"
            onClick={xoaBoLoc}
          >
            Xóa bộ lọc
          </button>
        </div>

        <div className="canhbao-filters">
          {/* Tim kiem */}
          <label className="canhbao-field">
            <span>Tìm kiếm</span>

            <div className="canhbao-search">
              <Search size={17} />

              <input
                value={tuKhoa}
                onChange={(event) =>
                  setTuKhoa(event.target.value)
                }
                placeholder="Mã, cảm biến, mô tả..."
              />
            </div>
          </label>

          {/* Loc cam bien */}
          <label className="canhbao-field">
            <span>Cảm biến</span>

            <select
              value={locCamBien}
              onChange={(event) =>
                setLocCamBien(event.target.value)
              }
            >
              <option value="all">
                Tất cả cảm biến
              </option>

              {danhSachCamBien.map((item) => (
                <option
                  key={item.maCamBien}
                  value={item.maCamBien}
                >
                  {item.tenCamBien}
                </option>
              ))}
            </select>
          </label>

          {/* Loc loai canh bao */}
          <label className="canhbao-field">
            <span>Loại cảnh báo</span>

            <select
              value={locLoai}
              onChange={(event) =>
                setLocLoai(event.target.value)
              }
            >
              <option value="all">
                Tất cả loại
              </option>

              {danhSachLoai.map((loai) => (
                <option key={loai} value={loai}>
                  {hienThiLoai(loai)}
                </option>
              ))}
            </select>
          </label>

          {/* Loc trang thai */}
          <label className="canhbao-field">
            <span>Trạng thái</span>

            <select
              value={locTrangThai}
              onChange={(event) =>
                setLocTrangThai(event.target.value)
              }
            >
              <option value="all">
                Tất cả trạng thái
              </option>

              <option value="MOI">
                Mới
              </option>

              <option value="DA_XU_LY">
                Đã xử lý
              </option>
            </select>
          </label>
        </div>
      </section>

      {/* Danh sach canh bao */}
      <section className="canhbao-panel">
        <div className="canhbao-panel-title">
          <h2>Danh sách cảnh báo</h2>
          <span>{danhSachLoc.length} cảnh báo</span>
        </div>

        {dangTai ? (
          <p className="canhbao-empty">
            Đang tải dữ liệu...
          </p>
        ) : danhSachLoc.length === 0 ? (
          <p className="canhbao-empty">
            Không có cảnh báo phù hợp với bộ lọc.
          </p>
        ) : (
          <div className="canhbao-table-wrap">
            <table className="canhbao-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Cảm biến</th>
                  <th>Loại cảnh báo</th>
                  <th>Mô tả</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>

                  {laAdmin && <th>Thao tác</th>}
                </tr>
              </thead>

              <tbody>
                {danhSachLoc.map((item) => (
                  <tr key={item.maNgoaiLe}>
                    <td>#{item.maNgoaiLe}</td>

                    <td className="canhbao-name">
                      {item.tenCamBien}
                    </td>

                    <td>
                      {hienThiLoai(item.loaiNgoaiLe)}
                    </td>

                    <td className="canhbao-description">
                      {item.moTa || "Không có mô tả"}
                    </td>

                    <td>
                      {hienThiThoiGian(
                        item.thoiGianPhatHien
                      )}
                    </td>

                    <td>
                      <span
                        className={`canhbao-badge ${
                          item.trangThai === "MOI"
                            ? "canhbao-badge-new"
                            : "canhbao-badge-done"
                        }`}
                      >
                        {item.trangThai === "MOI"
                          ? "Mới"
                          : item.trangThai === "DA_XU_LY"
                            ? "Đã xử lý"
                            : item.trangThai}
                      </span>
                    </td>

                    {laAdmin && (
                      <td>
                        {item.trangThai === "MOI" ? (
                          <button
                            type="button"
                            className="canhbao-btn canhbao-btn-success"
                            onClick={() =>
                              void danhDauDaXuLy(item)
                            }
                            disabled={
                              maDangXuLy !== null ||
                              dangTai ||
                              dangLamMoi
                            }
                          >
                            <CheckCircle2 size={15} />

                            {maDangXuLy === item.maNgoaiLe
                              ? "Đang xử lý..."
                              : "Đánh dấu đã xử lý"}
                          </button>
                        ) : (
                          <span className="canhbao-no-action">
                            {item.trangThai === "DA_XU_LY"
                              ? "Hoàn tất"
                              : "—"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ghi chu */}
      <p className="canhbao-note">
        Trang hiển thị tối đa 100 cảnh báo mới nhất từ API.
        Dữ liệu tự động cập nhật mỗi 5 giây.
        Đánh dấu đã xử lý là thao tác xác nhận của người quản trị,
        không đồng nghĩa điều kiện môi trường đã trở lại bình thường.
      </p>
    </div>
  );
}
