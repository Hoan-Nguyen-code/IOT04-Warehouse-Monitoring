
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CheckCircle2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Unlock,
  Users,
  X,
} from "lucide-react";
import axios from "axios";

import api from "../services/api";
import {
  taiKhoanService,
  type TaiKhoan as TaiKhoanModel,
} from "../services/taiKhoanService";

import "../styles/taikhoan.css";

interface VungKho {
  maVung: number;
  tenVung: string;
}

type FormData = {
  tenDangNhap: string;
  matKhau: string;
  vaiTro: string;
  maVung: number | null;
};

const initialForm: FormData = {
  tenDangNhap: "",
  matKhau: "",
  vaiTro: "USER",
  maVung: null,
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (error.response?.status === 401) {
      return "Phiên đăng nhập đã hết hạn.";
    }

    if (error.response?.status === 403) {
      return "Bạn không có quyền thực hiện thao tác này.";
    }
  }

  return "Có lỗi xảy ra. Vui lòng thử lại.";
}

export default function TaiKhoan() {
  const [danhSach, setDanhSach] = useState<TaiKhoanModel[]>([]);
  const [danhSachVung, setDanhSachVung] = useState<VungKho[]>([]);

  const [timKiem, setTimKiem] = useState("");
  const [locVaiTro, setLocVaiTro] = useState("ALL");
  const [locTrangThai, setLocTrangThai] = useState("ALL");

  const [dangTai, setDangTai] = useState(true);
  const [dangTaiVung, setDangTaiVung] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [dangXuLyId, setDangXuLyId] = useState<number | null>(null);

  const [loi, setLoi] = useState("");
  const [thongBao, setThongBao] = useState("");

  const [moForm, setMoForm] = useState(false);
  const [taiKhoanSua, setTaiKhoanSua] =
    useState<TaiKhoanModel | null>(null);

  const [form, setForm] = useState<FormData>(initialForm);

  // Lay danh sach tai khoan
  async function taiDanhSach() {
    setDangTai(true);
    setLoi("");

    try {
      const data = await taiKhoanService.getAll();
      setDanhSach(data);
    } catch (error) {
      setLoi(getErrorMessage(error));
    } finally {
      setDangTai(false);
    }
  }

  // Lay danh sach vung kho tu backend
  async function taiDanhSachVung() {
    setDangTaiVung(true);

    try {
      const response = await api.get<VungKho[]>("/vung");
      setDanhSachVung(response.data);
    } catch (error) {
      setLoi(getErrorMessage(error));
      throw error;
    } finally {
      setDangTaiVung(false);
    }
  }

  useEffect(() => {
    void taiDanhSach();
  }, []);

  // Tim kiem va loc tai khoan
  const danhSachLoc = useMemo(() => {
    const keyword = timKiem.trim().toLowerCase();

    return danhSach.filter((item) => {
      const khopTen = item.tenDangNhap
        .toLowerCase()
        .includes(keyword);

      const khopVaiTro =
        locVaiTro === "ALL" || item.vaiTro === locVaiTro;

      const khopTrangThai =
        locTrangThai === "ALL" ||
        (locTrangThai === "ACTIVE" && item.trangThai) ||
        (locTrangThai === "LOCKED" && !item.trangThai);

      return khopTen && khopVaiTro && khopTrangThai;
    });
  }, [danhSach, timKiem, locVaiTro, locTrangThai]);

  // Thong ke
  const tongTaiKhoan = danhSach.length;

  const soAdmin = danhSach.filter(
    (item) => item.vaiTro === "ADMIN"
  ).length;

  const soHoatDong = danhSach.filter(
    (item) => item.trangThai
  ).length;

  const soBiKhoa = danhSach.filter(
    (item) => !item.trangThai
  ).length;

  // Mo form them moi
  async function moThemMoi() {
    setTaiKhoanSua(null);
    setForm({ ...initialForm });
    setLoi("");
    setThongBao("");

    try {
      await taiDanhSachVung();
      setMoForm(true);
    } catch {
      // Khong mo form khi chua tai duoc danh sach vung
    }
  }

  // Mo form chinh sua
  async function moChinhSua(item: TaiKhoanModel) {
    setTaiKhoanSua(item);

    setForm({
      tenDangNhap: item.tenDangNhap,
      matKhau: "",
      vaiTro: item.vaiTro,
      maVung: item.maVung,
    });

    setLoi("");
    setThongBao("");

    try {
      await taiDanhSachVung();
      setMoForm(true);
    } catch {
      // Khong mo form khi chua tai duoc danh sach vung
    }
  }

  // Dong form
  function dongForm() {
    if (dangLuu) return;

    setMoForm(false);
    setTaiKhoanSua(null);
    setForm({ ...initialForm });
    setLoi("");
  }

  // Them hoac cap nhat tai khoan
  async function luuTaiKhoan(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const tenDangNhap = form.tenDangNhap.trim();

    if (tenDangNhap.length < 3 || tenDangNhap.length > 50) {
      setLoi("Tên đăng nhập phải có từ 3 đến 50 ký tự.");
      return;
    }

    if (!taiKhoanSua && form.matKhau.length < 6) {
      setLoi("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    // ADMIN khong can phan cong vung kho
    const maVung =
      form.vaiTro === "USER" ? form.maVung : null;

    // Kiem tra vung kho duoc chon
    if (
      maVung !== null &&
      !danhSachVung.some((vung) => vung.maVung === maVung)
    ) {
      setLoi("Vùng kho được chọn không hợp lệ.");
      return;
    }

    setDangLuu(true);
    setLoi("");
    setThongBao("");

    try {
      if (taiKhoanSua) {
        await taiKhoanService.update(
          taiKhoanSua.maTaiKhoan,
          {
            tenDangNhap,
            vaiTro: form.vaiTro,
            maVung,
          }
        );

        setThongBao("Cập nhật tài khoản thành công.");
      } else {
        await taiKhoanService.create({
          tenDangNhap,
          matKhau: form.matKhau,
          vaiTro: form.vaiTro,
          maVung,
        });

        setThongBao("Thêm tài khoản thành công.");
      }

      setMoForm(false);
      setTaiKhoanSua(null);
      setForm({ ...initialForm });

      await taiDanhSach();
    } catch (error) {
      setLoi(getErrorMessage(error));
    } finally {
      setDangLuu(false);
    }
  }

  // Khoa hoac mo khoa tai khoan
  async function thayDoiTrangThai(item: TaiKhoanModel) {
    const trangThaiMoi = !item.trangThai;

    const xacNhan = window.confirm(
      trangThaiMoi
        ? `Bạn có muốn mở khóa tài khoản "${item.tenDangNhap}" không?`
        : `Bạn có muốn khóa tài khoản "${item.tenDangNhap}" không?`
    );

    if (!xacNhan) return;

    setDangXuLyId(item.maTaiKhoan);
    setLoi("");
    setThongBao("");

    try {
      await taiKhoanService.updateStatus(
        item.maTaiKhoan,
        trangThaiMoi
      );

      setThongBao(
        trangThaiMoi
          ? "Mở khóa tài khoản thành công."
          : "Khóa tài khoản thành công."
      );

      await taiDanhSach();
    } catch (error) {
      setLoi(getErrorMessage(error));
    } finally {
      setDangXuLyId(null);
    }
  }

  return (
    <div className="taikhoan-page">
      <div className="taikhoan-header">
        <div>
          <h1>Quản lý tài khoản</h1>
          <p>
            Quản lý người dùng, phân quyền, phân công vùng kho
            và trạng thái tài khoản trong hệ thống.
          </p>
        </div>

        <div className="taikhoan-header-actions">
          <button
            type="button"
            className="taikhoan-btn taikhoan-btn-secondary"
            onClick={() => void taiDanhSach()}
            disabled={dangTai}
          >
            <RefreshCw size={17} />
            Làm mới
          </button>

          <button
            type="button"
            className="taikhoan-btn taikhoan-btn-primary"
            onClick={() => void moThemMoi()}
            disabled={dangTaiVung}
          >
            <Plus size={17} />
            Thêm tài khoản
          </button>
        </div>
      </div>

      {thongBao && (
        <div className="taikhoan-success">
          <CheckCircle2 size={18} />
          {thongBao}
        </div>
      )}

      {loi && !moForm && (
        <div className="taikhoan-error">{loi}</div>
      )}

      <div className="taikhoan-stats">
        <div className="taikhoan-stat">
          <Users size={23} />
          <div>
            <span>Tổng tài khoản</span>
            <strong>{tongTaiKhoan}</strong>
          </div>
        </div>

        <div className="taikhoan-stat">
          <Shield size={23} />
          <div>
            <span>Quản trị viên</span>
            <strong>{soAdmin}</strong>
          </div>
        </div>

        <div className="taikhoan-stat">
          <CheckCircle2 size={23} />
          <div>
            <span>Đang hoạt động</span>
            <strong>{soHoatDong}</strong>
          </div>
        </div>

        <div className="taikhoan-stat">
          <Lock size={23} />
          <div>
            <span>Đã khóa</span>
            <strong>{soBiKhoa}</strong>
          </div>
        </div>
      </div>

      <section className="taikhoan-panel">
        <div className="taikhoan-panel-heading">
          <h2>Danh sách tài khoản</h2>
          <span>{danhSachLoc.length} tài khoản</span>
        </div>

        <div className="taikhoan-filters">
          <div className="taikhoan-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên đăng nhập..."
              value={timKiem}
              onChange={(event) =>
                setTimKiem(event.target.value)
              }
            />
          </div>

          <select
            value={locVaiTro}
            onChange={(event) =>
              setLocVaiTro(event.target.value)
            }
            aria-label="Lọc vai trò"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>

          <select
            value={locTrangThai}
            onChange={(event) =>
              setLocTrangThai(event.target.value)
            }
            aria-label="Lọc trạng thái"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>

        <div className="taikhoan-table-wrapper">
          <table className="taikhoan-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên đăng nhập</th>
                <th>Vai trò</th>
                <th>Vùng kho phụ trách</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {dangTai ? (
                <tr>
                  <td colSpan={6} className="taikhoan-empty">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : danhSachLoc.length === 0 ? (
                <tr>
                  <td colSpan={6} className="taikhoan-empty">
                    Không có tài khoản phù hợp.
                  </td>
                </tr>
              ) : (
                danhSachLoc.map((item) => (
                  <tr key={item.maTaiKhoan}>
                    <td>#{item.maTaiKhoan}</td>

                    <td className="taikhoan-username">
                      {item.tenDangNhap}
                    </td>

                    <td>
                      <span
                        className={`taikhoan-role ${
                          item.vaiTro === "ADMIN"
                            ? "taikhoan-role-admin"
                            : "taikhoan-role-user"
                        }`}
                      >
                        {item.vaiTro}
                      </span>
                    </td>

                    <td>
                      {item.vaiTro === "ADMIN"
                        ? "Toàn bộ vùng kho"
                        : item.tenVung ?? "Chưa phân công"}
                    </td>

                    <td>
                      <span
                        className={`taikhoan-status ${
                          item.trangThai
                            ? "taikhoan-status-active"
                            : "taikhoan-status-locked"
                        }`}
                      >
                        {item.trangThai
                          ? "Hoạt động"
                          : "Đã khóa"}
                      </span>
                    </td>

                    <td>
                      <div className="taikhoan-actions">
                        <button
                          type="button"
                          className="taikhoan-icon-btn"
                          title="Chỉnh sửa"
                          aria-label={`Chỉnh sửa ${item.tenDangNhap}`}
                          onClick={() => void moChinhSua(item)}
                          disabled={dangTaiVung}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className={`taikhoan-icon-btn ${
                            item.trangThai
                              ? "taikhoan-lock-btn"
                              : "taikhoan-unlock-btn"
                          }`}
                          title={
                            item.trangThai
                              ? "Khóa tài khoản"
                              : "Mở khóa tài khoản"
                          }
                          aria-label={`${
                            item.trangThai ? "Khóa" : "Mở khóa"
                          } ${item.tenDangNhap}`}
                          disabled={
                            dangXuLyId === item.maTaiKhoan
                          }
                          onClick={() =>
                            void thayDoiTrangThai(item)
                          }
                        >
                          {item.trangThai ? (
                            <Lock size={16} />
                          ) : (
                            <Unlock size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {moForm && (
        <div
          className="taikhoan-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              dongForm();
            }
          }}
        >
          <div
            className="taikhoan-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="taikhoan-modal-title"
          >
            <div className="taikhoan-modal-header">
              <h2 id="taikhoan-modal-title">
                {taiKhoanSua
                  ? "Chỉnh sửa tài khoản"
                  : "Thêm tài khoản mới"}
              </h2>

              <button
                type="button"
                className="taikhoan-close-btn"
                onClick={dongForm}
                disabled={dangLuu}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(event) => void luuTaiKhoan(event)}>
              <div className="taikhoan-modal-body">
                {loi && (
                  <div className="taikhoan-error">{loi}</div>
                )}

                <label className="taikhoan-form-field">
                  <span>Tên đăng nhập</span>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={50}
                    value={form.tenDangNhap}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        tenDangNhap: event.target.value,
                      })
                    }
                    placeholder="Nhập tên đăng nhập"
                  />
                </label>

                {!taiKhoanSua && (
                  <label className="taikhoan-form-field">
                    <span>Mật khẩu</span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      maxLength={100}
                      autoComplete="new-password"
                      value={form.matKhau}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          matKhau: event.target.value,
                        })
                      }
                      placeholder="Nhập mật khẩu"
                    />
                  </label>
                )}

                <label className="taikhoan-form-field">
                  <span>Vai trò</span>
                  <select
                    value={form.vaiTro}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        vaiTro: event.target.value,
                        maVung: null,
                      })
                    }
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>

                {form.vaiTro === "USER" && (
                  <label className="taikhoan-form-field">
                    <span>Vùng kho phụ trách</span>
                    <select
                      value={form.maVung ?? ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          maVung: event.target.value
                            ? Number(event.target.value)
                            : null,
                        })
                      }
                      disabled={dangTaiVung}
                    >
                      <option value="">
                        -- Chưa phân công --
                      </option>

                      {danhSachVung.map((vung) => (
                        <option
                          key={vung.maVung}
                          value={vung.maVung}
                        >
                          {vung.tenVung}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {form.vaiTro === "USER" && (
                  <p className="taikhoan-form-note">
                    Mỗi USER chỉ được phân công một vùng kho.
                    Có thể thay đổi hoặc bỏ phân công sau này.
                  </p>
                )}

                {taiKhoanSua && (
                  <p className="taikhoan-form-note">
                    Chỉnh sửa thông tin không làm thay đổi
                    mật khẩu hiện tại.
                  </p>
                )}
              </div>

              <div className="taikhoan-modal-footer">
                <button
                  type="button"
                  className="taikhoan-btn taikhoan-btn-secondary"
                  onClick={dongForm}
                  disabled={dangLuu}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="taikhoan-btn taikhoan-btn-primary"
                  disabled={dangLuu}
                >
                  {dangLuu
                    ? "Đang lưu..."
                    : taiKhoanSua
                      ? "Lưu thay đổi"
                      : "Thêm tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
