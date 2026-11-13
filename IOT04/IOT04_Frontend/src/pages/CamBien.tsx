
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  Activity,
  Cpu,
  MapPin,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import axios from "axios";

import { camBienService } from "../services/camBienService";
import type { CamBienRequest } from "../services/camBienService";
import { vungKhoService } from "../services/vungKhoService";
import { authService } from "../services/authService";

import type {
  CamBien as CamBienType,
  Vung,
} from "../types/dashboard";

import "../styles/cambien.css";

type CamBienRow = CamBienType & {
  tenVung: string;
};

const formMacDinh: CamBienRequest = {
  tenCamBien: "",
  maVung: 0,
  loaiCamBien: "DHT11",
  vaiTro: "CHINH",
  chuKyGuiDuLieu: 30,
  nguongMatKetNoi: 90,
};

function layLoi(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (error.response?.status === 403) {
      return "Tài khoản không có quyền thực hiện thao tác.";
    }

    if (error.response?.status === 401) {
      return "Phiên đăng nhập đã hết hạn.";
    }
  }

  return "Có lỗi xảy ra. Vui lòng thử lại.";
}

function hienThiTrangThai(trangThai: string) {
  switch (trangThai) {
    case "DANG_HOAT_DONG":
      return "Đang hoạt động";
    case "CHUA_KET_NOI":
      return "Chưa kết nối";
    case "MAT_KET_NOI":
      return "Mất kết nối";
    default:
      return trangThai;
  }
}

function hienThiVaiTro(vaiTro: string) {
  if (vaiTro === "CHINH") {
    return "Cảm biến chính";
  }

  if (vaiTro === "THAM_CHIEU") {
    return "Cảm biến tham chiếu";
  }

  return vaiTro;
}

function hienThiThoiGian(value: string | null) {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Không hợp lệ"
    : date.toLocaleString("vi-VN");
}

export default function CamBien() {
  const [danhSach, setDanhSach] = useState<CamBienRow[]>([]);
  const [danhSachVung, setDanhSachVung] = useState<Vung[]>([]);

  const [laAdmin, setLaAdmin] = useState(false);
  const [dangTai, setDangTai] = useState(true);
  const [dangLamMoi, setDangLamMoi] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);

  const [loi, setLoi] = useState("");
  const [thanhCong, setThanhCong] = useState("");

  const [moModal, setMoModal] = useState(false);
  const [maDangSua, setMaDangSua] = useState<number | null>(null);

  const [form, setForm] = useState<CamBienRequest>({
    ...formMacDinh,
  });

  const mountedRef = useRef(false);
  const requestingRef = useRef(false);
  const busyRef = useRef(false);
  const modalRef = useRef(false);

  const taiDuLieu = useCallback(async (thuCong = false) => {
    if (
      requestingRef.current ||
      busyRef.current ||
      modalRef.current
    ) {
      return;
    }

    requestingRef.current = true;

    if (thuCong) {
      setDangLamMoi(true);
    }

    try {
      const [camBien, vung] = await Promise.all([
        camBienService.getAll(),
        vungKhoService.getAll(),
      ]);

      if (!mountedRef.current) return;

      // Khong ghi de du lieu trong luc ADMIN thao tac
      if (busyRef.current || modalRef.current) return;

      const danhSachMoi: CamBienRow[] = camBien.map(
        (item) => ({
          ...item,
          tenVung:
            vung.find(
              (v) => v.maVung === item.maVung
            )?.tenVung ?? "Chưa xác định",
        })
      );

      setDanhSachVung(vung);
      setDanhSach(danhSachMoi);
      setLoi("");
    } catch (error) {
      if (mountedRef.current && !modalRef.current) {
        setLoi(layLoi(error));
      }
    } finally {
      requestingRef.current = false;

      if (mountedRef.current) {
        setDangTai(false);
        setDangLamMoi(false);
      }
    }
  }, []);

  // Tai du lieu ban dau va polling 5 giay
  useEffect(() => {
    mountedRef.current = true;

    void taiDuLieu();

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
      if (
        !document.hidden &&
        !modalRef.current &&
        !busyRef.current
      ) {
        void taiDuLieu();
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [taiDuLieu]);

  // Nap lai du lieu sau thao tac CRUD
  async function napLaiDuLieu() {
    if (requestingRef.current) return;

    requestingRef.current = true;

    try {
      const [camBien, vung] = await Promise.all([
        camBienService.getAll(),
        vungKhoService.getAll(),
      ]);

      if (!mountedRef.current) return;

      setDanhSachVung(vung);
      setDanhSach(
        camBien.map((item) => ({
          ...item,
          tenVung:
            vung.find(
              (v) => v.maVung === item.maVung
            )?.tenVung ?? "Chưa xác định",
        }))
      );
    } catch (error) {
      if (mountedRef.current) {
        setLoi(layLoi(error));
      }
    } finally {
      requestingRef.current = false;
    }
  }

  function moThem() {
    if (!laAdmin || dangLuu || requestingRef.current) {
      return;
    }

    modalRef.current = true;
    setMaDangSua(null);

    setForm({
      ...formMacDinh,
      maVung: danhSachVung[0]?.maVung ?? 0,
    });

    setLoi("");
    setThanhCong("");
    setMoModal(true);
  }

  function moSua(camBien: CamBienRow) {
    if (!laAdmin || dangLuu || requestingRef.current) {
      return;
    }

    modalRef.current = true;
    setMaDangSua(camBien.maCamBien);

    setForm({
      tenCamBien: camBien.tenCamBien,
      maVung: camBien.maVung,
      loaiCamBien:
        camBien.loaiCamBien as CamBienRequest["loaiCamBien"],
      vaiTro:
        camBien.vaiTro as CamBienRequest["vaiTro"],
      chuKyGuiDuLieu: camBien.chuKyGuiDuLieu,
      nguongMatKetNoi: camBien.nguongMatKetNoi,
    });

    setLoi("");
    setThanhCong("");
    setMoModal(true);
  }

  function dongModal() {
    if (dangLuu) return;

    modalRef.current = false;
    setMoModal(false);
    setLoi("");

    void taiDuLieu();
  }

  async function luuCamBien(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!laAdmin || busyRef.current || dangLuu) {
      return;
    }

    if (!form.tenCamBien.trim()) {
      setLoi("Vui lòng nhập tên cảm biến.");
      return;
    }

    if (form.maVung <= 0) {
      setLoi("Vui lòng chọn vùng kho.");
      return;
    }

    if (
      !Number.isInteger(form.chuKyGuiDuLieu) ||
      !Number.isInteger(form.nguongMatKetNoi) ||
      form.chuKyGuiDuLieu <= 0 ||
      form.chuKyGuiDuLieu > 86400 ||
      form.nguongMatKetNoi > 86400 ||
      form.nguongMatKetNoi <= form.chuKyGuiDuLieu
    ) {
      setLoi(
        "Chu kỳ gửi và ngưỡng mất kết nối phải hợp lệ; ngưỡng mất kết nối phải lớn hơn chu kỳ gửi."
      );
      return;
    }

    busyRef.current = true;
    setDangLuu(true);
    setLoi("");
    setThanhCong("");

    try {
      const data: CamBienRequest = {
        ...form,
        tenCamBien: form.tenCamBien.trim(),
      };

      if (maDangSua === null) {
        await camBienService.create(data);
      } else {
        await camBienService.update(maDangSua, data);
      }

      if (!mountedRef.current) return;

      modalRef.current = false;
      setMoModal(false);

      setThanhCong(
        maDangSua === null
          ? "Thêm cảm biến thành công."
          : "Cập nhật cảm biến thành công."
      );

      await napLaiDuLieu();
    } catch (error) {
      if (mountedRef.current) {
        setLoi(layLoi(error));
      }
    } finally {
      busyRef.current = false;

      if (mountedRef.current) {
        setDangLuu(false);
      }
    }
  }

  async function xoaCamBien(camBien: CamBienRow) {
    if (
      !laAdmin ||
      busyRef.current ||
      dangLuu ||
      requestingRef.current
    ) {
      return;
    }

    const dongY = window.confirm(
      `Ông có chắc muốn xóa cảm biến "${camBien.tenCamBien}" không?`
    );

    if (!dongY) return;

    busyRef.current = true;
    setDangLuu(true);
    setLoi("");
    setThanhCong("");

    try {
      await camBienService.remove(camBien.maCamBien);

      if (!mountedRef.current) return;

      setThanhCong("Xóa cảm biến thành công.");
      await napLaiDuLieu();
    } catch (error) {
      if (mountedRef.current) {
        setLoi(layLoi(error));
      }
    } finally {
      busyRef.current = false;

      if (mountedRef.current) {
        setDangLuu(false);
      }
    }
  }

  const soDangHoatDong = danhSach.filter(
    (item) => item.trangThai === "DANG_HOAT_DONG"
  ).length;

  const soMatKetNoi = danhSach.filter(
    (item) => item.trangThai === "MAT_KET_NOI"
  ).length;

  return (
    <div className="cambien-page">
      <div className="cambien-header">
        <div>
          <h1>Quản lý cảm biến</h1>
          <p>
            Theo dõi và quản lý các cảm biến nhiệt độ,
            độ ẩm trong kho.
          </p>
        </div>

        <div className="cambien-actions">
          <button
            type="button"
            className="cambien-btn cambien-btn-secondary"
            onClick={() => void taiDuLieu(true)}
            disabled={
              dangTai ||
              dangLamMoi ||
              dangLuu ||
              moModal
            }
          >
            <RefreshCw size={17} />
            {dangLamMoi ? "Đang làm mới..." : "Làm mới"}
          </button>

          {laAdmin && (
            <button
              type="button"
              className="cambien-btn cambien-btn-primary"
              onClick={moThem}
              disabled={
                dangTai ||
                dangLuu ||
                moModal ||
                danhSachVung.length === 0
              }
            >
              <Plus size={17} />
              Thêm cảm biến
            </button>
          )}
        </div>
      </div>

      {thanhCong && (
        <div className="cambien-success">
          {thanhCong}
        </div>
      )}

      {loi && !moModal && (
        <div className="cambien-error">{loi}</div>
      )}

      <div className="cambien-stats">
        <div className="cambien-stat">
          <Cpu size={24} />
          <div>
            <span>Tổng cảm biến</span>
            <strong>{danhSach.length}</strong>
          </div>
        </div>

        <div className="cambien-stat">
          <Activity size={24} />
          <div>
            <span>Đang hoạt động</span>
            <strong>{soDangHoatDong}</strong>
          </div>
        </div>

        <div className="cambien-stat">
          <MapPin size={24} />
          <div>
            <span>Vùng kho có cảm biến</span>
            <strong>
              {new Set(
                danhSach.map((item) => item.maVung)
              ).size}
            </strong>
          </div>
        </div>
      </div>

      {soMatKetNoi > 0 && (
        <div className="cambien-error">
          Có {soMatKetNoi} cảm biến đang mất kết nối.
          Vui lòng kiểm tra thiết bị hoặc đường truyền MQTT.
        </div>
      )}

      <div className="cambien-table-wrapper">
        <div className="cambien-table-heading">
          <h2>Danh sách cảm biến</h2>
          <span>{danhSach.length} cảm biến</span>
        </div>

        {dangTai ? (
          <p className="cambien-message">
            Đang tải dữ liệu...
          </p>
        ) : danhSach.length === 0 ? (
          <p className="cambien-message">
            Chưa có cảm biến nào.
          </p>
        ) : (
          <div className="cambien-table-scroll">
            <table className="cambien-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên cảm biến</th>
                  <th>Loại</th>
                  <th>Vai trò</th>
                  <th>Vùng kho</th>
                  <th>Trạng thái</th>
                  <th>Dữ liệu cuối</th>
                  <th>Chu kỳ gửi</th>
                  <th>Ngưỡng mất kết nối</th>
                  {laAdmin && <th>Thao tác</th>}
                </tr>
              </thead>

              <tbody>
                {danhSach.map((camBien) => (
                  <tr key={camBien.maCamBien}>
                    <td>#{camBien.maCamBien}</td>

                    <td className="cambien-name">
                      {camBien.tenCamBien}
                    </td>

                    <td>{camBien.loaiCamBien}</td>

                    <td>
                      {hienThiVaiTro(camBien.vaiTro)}
                    </td>

                    <td>{camBien.tenVung}</td>

                    <td>
                      <span
                        className={`cambien-status ${
                          camBien.trangThai === "DANG_HOAT_DONG"
                            ? "cambien-status-active"
                            : "cambien-status-inactive"
                        }`}
                      >
                        {hienThiTrangThai(
                          camBien.trangThai
                        )}
                      </span>
                    </td>

                    <td>
                      {hienThiThoiGian(
                        camBien.thoiDiemDuLieuCuoi
                      )}
                    </td>

                    <td>
                      {camBien.chuKyGuiDuLieu}s
                    </td>

                    <td>
                      {camBien.nguongMatKetNoi}s
                    </td>

                    {laAdmin && (
                      <td>
                        <div className="cambien-row-actions">
                          <button
                            type="button"
                            title="Sửa cảm biến"
                            aria-label={`Sửa ${camBien.tenCamBien}`}
                            onClick={() => moSua(camBien)}
                            disabled={dangLuu || dangLamMoi}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title="Xóa cảm biến"
                            aria-label={`Xóa ${camBien.tenCamBien}`}
                            onClick={() =>
                              void xoaCamBien(camBien)
                            }
                            disabled={dangLuu || dangLamMoi}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {laAdmin && moModal && (
        <div className="cambien-modal-backdrop">
          <div
            className="cambien-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cambien-modal-title"
          >
            <div className="cambien-modal-header">
              <h2 id="cambien-modal-title">
                {maDangSua === null
                  ? "Thêm cảm biến"
                  : "Sửa cảm biến"}
              </h2>

              <button
                type="button"
                className="cambien-modal-close"
                onClick={dongModal}
                disabled={dangLuu}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(event) =>
                void luuCamBien(event)
              }
            >
              <div className="cambien-form-body">
                {loi && (
                  <div className="cambien-error">
                    {loi}
                  </div>
                )}

                <label className="cambien-field">
                  <span>Tên cảm biến</span>
                  <input
                    value={form.tenCamBien}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        tenCamBien: event.target.value,
                      })
                    }
                    maxLength={100}
                    required
                    disabled={dangLuu}
                    placeholder="Ví dụ: DHT11-02"
                  />
                </label>

                <label className="cambien-field">
                  <span>Vùng kho</span>
                  <select
                    value={form.maVung}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        maVung: Number(event.target.value),
                      })
                    }
                    required
                    disabled={dangLuu}
                  >
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

                <div className="cambien-form-grid">
                  <label className="cambien-field">
                    <span>Loại cảm biến</span>
                    <select
                      value={form.loaiCamBien}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          loaiCamBien:
                            event.target.value as CamBienRequest["loaiCamBien"],
                        })
                      }
                      disabled={dangLuu}
                    >
                      <option value="DHT11">DHT11</option>
                      <option value="SHT30">SHT30</option>
                    </select>
                  </label>

                  <label className="cambien-field">
                    <span>Vai trò</span>
                    <select
                      value={form.vaiTro}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          vaiTro:
                            event.target.value as CamBienRequest["vaiTro"],
                        })
                      }
                      disabled={dangLuu}
                    >
                      <option value="CHINH">
                        Cảm biến chính
                      </option>
                      <option value="THAM_CHIEU">
                        Cảm biến tham chiếu
                      </option>
                    </select>
                  </label>
                </div>

                <div className="cambien-form-grid">
                  <label className="cambien-field">
                    <span>Chu kỳ gửi dữ liệu (giây)</span>
                    <input
                      type="number"
                      min={1}
                      max={86400}
                      step={1}
                      value={form.chuKyGuiDuLieu}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          chuKyGuiDuLieu: Number(
                            event.target.value
                          ),
                        })
                      }
                      required
                      disabled={dangLuu}
                    />
                  </label>

                  <label className="cambien-field">
                    <span>Ngưỡng mất kết nối (giây)</span>
                    <input
                      type="number"
                      min={1}
                      max={86400}
                      step={1}
                      value={form.nguongMatKetNoi}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          nguongMatKetNoi: Number(
                            event.target.value
                          ),
                        })
                      }
                      required
                      disabled={dangLuu}
                    />
                  </label>
                </div>
              </div>

              <div className="cambien-modal-footer">
                <button
                  type="button"
                  className="cambien-btn cambien-btn-secondary"
                  onClick={dongModal}
                  disabled={dangLuu}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="cambien-btn cambien-btn-primary"
                  disabled={dangLuu}
                >
                  {dangLuu
                    ? "Đang lưu..."
                    : "Lưu cảm biến"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
