
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Activity,
  CalendarDays,
  Droplets,
  RefreshCw,
  Search,
  Thermometer,
} from "lucide-react";

import { lichSuService } from "../services/lichSuService";

import type {
  CamBien,
  DuLieuCamBien,
  Vung,
} from "../types/dashboard";

import "../styles/lichsu.css";

type LichSuRow = DuLieuCamBien & {
  tenCamBien: string;
  loaiCamBien: string;
  maVung: number | null;
  tenVung: string;
  vuotNhietDo: boolean;
  vuotDoAm: boolean;
  coNguong: boolean;
};

const CHU_KY_CAP_NHAT = 5000;

function hienThiThoiGian(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Không xác định"
    : date.toLocaleString("vi-VN");
}

function dinhDangSo(value: number) {
  return value.toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  });
}

export default function LichSu() {
  const [duLieu, setDuLieu] = useState<DuLieuCamBien[]>([]);
  const [camBien, setCamBien] = useState<CamBien[]>([]);
  const [vung, setVung] = useState<Vung[]>([]);

  const [dangTai, setDangTai] = useState(true);
  const [dangLamMoi, setDangLamMoi] = useState(false);
  const [loi, setLoi] = useState("");

  const [tuKhoa, setTuKhoa] = useState("");
  const [locCamBien, setLocCamBien] = useState("all");
  const [locVung, setLocVung] = useState("all");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  const mountedRef = useRef(false);
  const requestingRef = useRef(false);

  // Tai du lieu tu Backend
  const taiDuLieu = useCallback(async (thuCong = false) => {
    if (requestingRef.current) return;

    requestingRef.current = true;

    if (thuCong) {
      setDangLamMoi(true);
    }

    try {
      const [dsDuLieu, dsCamBien, dsVung] =
        await Promise.all([
          lichSuService.getDuLieu(),
          lichSuService.getCamBien(),
          lichSuService.getVung(),
        ]);

      if (!mountedRef.current) return;

      setDuLieu(dsDuLieu);
      setCamBien(dsCamBien);
      setVung(dsVung);
      setLoi("");
    } catch {
      if (mountedRef.current) {
        setLoi(
          "Không thể tải lịch sử dữ liệu cảm biến."
        );
      }
    } finally {
      requestingRef.current = false;

      if (mountedRef.current) {
        setDangTai(false);
        setDangLamMoi(false);
      }
    }
  }, []);

  // Tai lan dau va tu dong cap nhat 5 giay
  useEffect(() => {
    mountedRef.current = true;

    void taiDuLieu();

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        void taiDuLieu();
      }
    }, CHU_KY_CAP_NHAT);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [taiDuLieu]);

  // Ket hop du lieu cam bien va vung kho
  const danhSach = useMemo<LichSuRow[]>(() => {
    const camBienMap = new Map(
      camBien.map((item) => [
        item.maCamBien,
        item,
      ])
    );

    const vungMap = new Map(
      vung.map((item) => [
        item.maVung,
        item,
      ])
    );

    return duLieu
      .map((item) => {
        const cb = camBienMap.get(item.maCamBien);

        const v = cb
          ? vungMap.get(cb.maVung)
          : undefined;

        return {
          ...item,

          tenCamBien:
            cb?.tenCamBien ??
            `Cảm biến #${item.maCamBien}`,

          loaiCamBien:
            cb?.loaiCamBien ?? "Không xác định",

          maVung: cb?.maVung ?? null,

          tenVung:
            v?.tenVung ?? "Không xác định",

          coNguong: v !== undefined,

          vuotNhietDo: v
            ? item.nhietDo < v.nhietDoMin ||
              item.nhietDo > v.nhietDoMax
            : false,

          vuotDoAm: v
            ? item.doAm < v.doAmMin ||
              item.doAm > v.doAmMax
            : false,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.thoiGianGhiNhan).getTime() -
            new Date(a.thoiGianGhiNhan).getTime() ||
          b.maDuLieu - a.maDuLieu
      );
  }, [duLieu, camBien, vung]);

  // Loc du lieu tren trinh duyet
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
        locVung !== "all" &&
        item.maVung !== Number(locVung)
      ) {
        return false;
      }

      if (
        keyword &&
        ![
          item.tenCamBien,
          item.loaiCamBien,
          item.tenVung,
          String(item.maDuLieu),
        ].some((value) =>
          value.toLowerCase().includes(keyword)
        )
      ) {
        return false;
      }

      // Backend luu thoi gian theo DateTime local.
      // Lay phan ngay tu chuoi API de loc.
      const ngayGhiNhan =
        item.thoiGianGhiNhan.slice(0, 10);

      if (tuNgay && ngayGhiNhan < tuNgay) {
        return false;
      }

      if (denNgay && ngayGhiNhan > denNgay) {
        return false;
      }

      return true;
    });
  }, [
    danhSach,
    tuKhoa,
    locCamBien,
    locVung,
    tuNgay,
    denNgay,
  ]);

  // Thong ke theo du lieu dang hien thi
  const nhietDoTrungBinh =
    danhSachLoc.length > 0
      ? danhSachLoc.reduce(
          (sum, item) => sum + item.nhietDo,
          0
        ) / danhSachLoc.length
      : null;

  const doAmTrungBinh =
    danhSachLoc.length > 0
      ? danhSachLoc.reduce(
          (sum, item) => sum + item.doAm,
          0
        ) / danhSachLoc.length
      : null;

  const soBanGhiVuotNguong =
    danhSachLoc.filter(
      (item) => item.vuotNhietDo || item.vuotDoAm
    ).length;

  const soBanGhiChuaDanhGia =
    danhSachLoc.filter(
      (item) => !item.coNguong
    ).length;

  function xoaBoLoc() {
    setTuKhoa("");
    setLocCamBien("all");
    setLocVung("all");
    setTuNgay("");
    setDenNgay("");
  }

  return (
    <div className="lichsu-page">
      <div className="lichsu-header">
        <div>
          <h1>Lịch sử dữ liệu cảm biến</h1>
          <p>
            Tra cứu nhiệt độ, độ ẩm và thời gian
            ghi nhận của các cảm biến trong kho.
          </p>
        </div>

        <button
          type="button"
          className="lichsu-btn lichsu-btn-primary"
          onClick={() => void taiDuLieu(true)}
          disabled={dangTai || dangLamMoi}
        >
          <RefreshCw size={17} />
          {dangLamMoi
            ? "Đang làm mới..."
            : "Làm mới"}
        </button>
      </div>

      {loi && (
        <div className="lichsu-error">
          {loi}
        </div>
      )}

      <div className="lichsu-stats">
        <div className="lichsu-stat">
          <Activity size={24} />
          <div>
            <span>Số bản ghi hiển thị</span>
            <strong>{danhSachLoc.length}</strong>
          </div>
        </div>

        <div className="lichsu-stat">
          <Thermometer size={24} />
          <div>
            <span>Nhiệt độ trung bình</span>
            <strong>
              {nhietDoTrungBinh === null
                ? "--"
                : `${dinhDangSo(nhietDoTrungBinh)}°C`}
            </strong>
          </div>
        </div>

        <div className="lichsu-stat">
          <Droplets size={24} />
          <div>
            <span>Độ ẩm trung bình</span>
            <strong>
              {doAmTrungBinh === null
                ? "--"
                : `${dinhDangSo(doAmTrungBinh)}%`}
            </strong>
          </div>
        </div>

        <div className="lichsu-stat">
          <CalendarDays size={24} />
          <div>
            <span>Bản ghi vượt ngưỡng</span>
            <strong>{soBanGhiVuotNguong}</strong>
          </div>
        </div>
      </div>

      <section className="lichsu-panel">
        <div className="lichsu-panel-title">
          <h2>Bộ lọc dữ liệu</h2>

          <button
            type="button"
            className="lichsu-btn lichsu-btn-secondary"
            onClick={xoaBoLoc}
          >
            Xóa bộ lọc
          </button>
        </div>

        <div className="lichsu-filters">
          <label className="lichsu-field">
            <span>Tìm kiếm</span>

            <div className="lichsu-search">
              <Search size={17} />

              <input
                value={tuKhoa}
                onChange={(event) =>
                  setTuKhoa(event.target.value)
                }
                placeholder="Tên cảm biến, vùng kho, mã dữ liệu..."
              />
            </div>
          </label>

          <label className="lichsu-field">
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

              {camBien.map((item) => (
                <option
                  key={item.maCamBien}
                  value={item.maCamBien}
                >
                  {item.tenCamBien}
                </option>
              ))}
            </select>
          </label>

          <label className="lichsu-field">
            <span>Vùng kho</span>

            <select
              value={locVung}
              onChange={(event) =>
                setLocVung(event.target.value)
              }
            >
              <option value="all">
                Tất cả vùng kho
              </option>

              {vung.map((item) => (
                <option
                  key={item.maVung}
                  value={item.maVung}
                >
                  {item.tenVung}
                </option>
              ))}
            </select>
          </label>

          <label className="lichsu-field">
            <span>Từ ngày</span>

            <input
              type="date"
              value={tuNgay}
              max={denNgay || undefined}
              onChange={(event) =>
                setTuNgay(event.target.value)
              }
            />
          </label>

          <label className="lichsu-field">
            <span>Đến ngày</span>

            <input
              type="date"
              value={denNgay}
              min={tuNgay || undefined}
              onChange={(event) =>
                setDenNgay(event.target.value)
              }
            />
          </label>
        </div>
      </section>

      <section className="lichsu-panel">
        <div className="lichsu-panel-title">
          <h2>Danh sách lịch sử</h2>

          <span>
            {danhSachLoc.length} bản ghi
          </span>
        </div>

        {dangTai ? (
          <p className="lichsu-empty">
            Đang tải dữ liệu...
          </p>
        ) : danhSachLoc.length === 0 ? (
          <p className="lichsu-empty">
            Không có dữ liệu phù hợp với bộ lọc.
          </p>
        ) : (
          <div className="lichsu-table-wrap">
            <table className="lichsu-table">
              <thead>
                <tr>
                  <th>Mã dữ liệu</th>
                  <th>Cảm biến</th>
                  <th>Loại</th>
                  <th>Vùng kho</th>
                  <th>Nhiệt độ</th>
                  <th>Độ ẩm</th>
                  <th>Thời gian ghi nhận</th>
                  <th>Đánh giá</th>
                </tr>
              </thead>

              <tbody>
                {danhSachLoc.map((item) => {
                  const vuotNguong =
                    item.vuotNhietDo ||
                    item.vuotDoAm;

                  return (
                    <tr key={item.maDuLieu}>
                      <td>#{item.maDuLieu}</td>

                      <td className="lichsu-name">
                        {item.tenCamBien}
                      </td>

                      <td>
                        {item.loaiCamBien}
                      </td>

                      <td>
                        {item.tenVung}
                      </td>

                      <td
                        className={
                          item.vuotNhietDo
                            ? "lichsu-danger"
                            : ""
                        }
                      >
                        {dinhDangSo(item.nhietDo)}°C
                      </td>

                      <td
                        className={
                          item.vuotDoAm
                            ? "lichsu-danger"
                            : ""
                        }
                      >
                        {dinhDangSo(item.doAm)}%
                      </td>

                      <td>
                        {hienThiThoiGian(
                          item.thoiGianGhiNhan
                        )}
                      </td>

                      <td>
                        <span
                          className={`lichsu-badge ${
                            vuotNguong
                              ? "lichsu-badge-warning"
                              : "lichsu-badge-normal"
                          }`}
                        >
                          {!item.coNguong
                            ? "Chưa đánh giá"
                            : vuotNguong
                              ? "Vượt ngưỡng"
                              : "Bình thường"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="lichsu-note">
        Trang hiển thị tối đa 100 bản ghi mới nhất
        từ API và tự động cập nhật mỗi 5 giây.
        Bộ lọc chỉ áp dụng trên dữ liệu đã tải.
        Đánh giá vượt ngưỡng dựa trên cấu hình
        vùng kho hiện tại.
        {soBanGhiChuaDanhGia > 0 &&
          ` Có ${soBanGhiChuaDanhGia} bản ghi chưa đủ thông tin vùng kho để đánh giá.`}
      </p>
    </div>
  );
}
