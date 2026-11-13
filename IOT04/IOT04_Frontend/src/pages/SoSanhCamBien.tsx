
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  Droplets,
  RefreshCw,
  Thermometer,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { lichSuService } from "../services/lichSuService";
import type { CamBien, DuLieuCamBien } from "../types/dashboard";

import "../styles/sosanh.css";

const CHU_KY_CAP_NHAT = 5000;
const SAI_LECH_THOI_GIAN = 10000;
const THOI_GIAN_DU_LIEU_MOI = 20000;
const NGUONG_NHIET_DO = 3;
const NGUONG_DO_AM = 15;

type CapDuLieu = {
  a: DuLieuCamBien;
  b: DuLieuCamBien;
};

type DuLieuBieuDo = {
  nhan: string;
  nhietDoA: number;
  nhietDoB: number;
  doAmA: number;
  doAmB: number;
};

function dinhDangSo(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  return value.toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  });
}

function hienThiThoiGian(value: string | null) {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Không xác định"
    : date.toLocaleString("vi-VN");
}

function layThoiGian(item: DuLieuCamBien) {
  return new Date(item.thoiGianGhiNhan).getTime();
}

function hienThiTrangThai(value?: string) {
  switch (value) {
    case "DANG_HOAT_DONG":
      return "Đang hoạt động";
    case "MAT_KET_NOI":
      return "Mất kết nối";
    case "CHUA_KET_NOI":
      return "Chưa kết nối";
    default:
      return value ?? "Không xác định";
  }
}

// Ghep cac ban ghi gan nhau nhat trong khoang 10 giay.
// Moi ban ghi chi duoc su dung mot lan.
function ghepDuLieu(
  danhSachA: DuLieuCamBien[],
  danhSachB: DuLieuCamBien[]
): CapDuLieu[] {
  const ketQua: CapDuLieu[] = [];
  let i = 0;
  let j = 0;

  while (i < danhSachA.length && j < danhSachB.length) {
    const a = danhSachA[i];
    const b = danhSachB[j];

    const thoiGianA = layThoiGian(a);
    const thoiGianB = layThoiGian(b);

    if (
      !Number.isFinite(thoiGianA) ||
      !Number.isFinite(thoiGianB)
    ) {
      if (!Number.isFinite(thoiGianA)) i++;
      if (!Number.isFinite(thoiGianB)) j++;
      continue;
    }

    const chenhlech = thoiGianA - thoiGianB;

    if (Math.abs(chenhlech) <= SAI_LECH_THOI_GIAN) {
      ketQua.push({ a, b });
      i++;
      j++;
    } else if (chenhlech < 0) {
      i++;
    } else {
      j++;
    }
  }

  return ketQua;
}

export default function SoSanhCamBien() {
  const [camBien, setCamBien] = useState<CamBien[]>([]);
  const [duLieu, setDuLieu] = useState<DuLieuCamBien[]>([]);

  const [maCamBienA, setMaCamBienA] = useState<number | null>(null);
  const [maCamBienB, setMaCamBienB] = useState<number | null>(null);

  const [dangTai, setDangTai] = useState(true);
  const [dangLamMoi, setDangLamMoi] = useState(false);
  const [loi, setLoi] = useState("");
  const [thoiGianHienTai, setThoiGianHienTai] = useState(
    Date.now()
  );

  const mountedRef = useRef(false);
  const requestingRef = useRef(false);

  const taiDuLieu = useCallback(async (thuCong = false) => {
    if (requestingRef.current) return;

    requestingRef.current = true;

    if (thuCong) {
      setDangLamMoi(true);
    }

    try {
      const [dsCamBien, dsDuLieu] = await Promise.all([
        lichSuService.getCamBien(),
        lichSuService.getDuLieu(),
      ]);

      if (!mountedRef.current) return;

      setCamBien(dsCamBien);
      setDuLieu(dsDuLieu);
      setThoiGianHienTai(Date.now());

      setMaCamBienA((current) =>
        current !== null &&
        dsCamBien.some(
          (item) => item.maCamBien === current
        )
          ? current
          : dsCamBien.find(
              (item) => item.maCamBien === 1
            )?.maCamBien ??
            dsCamBien.find(
              (item) => item.loaiCamBien === "DHT11"
            )?.maCamBien ??
            dsCamBien[0]?.maCamBien ??
            null
      );

      setMaCamBienB((current) =>
        current !== null &&
        dsCamBien.some(
          (item) => item.maCamBien === current
        )
          ? current
          : dsCamBien.find(
              (item) => item.maCamBien === 3
            )?.maCamBien ??
            dsCamBien.find(
              (item) => item.loaiCamBien === "SHT30"
            )?.maCamBien ??
            dsCamBien[1]?.maCamBien ??
            null
      );

      setLoi("");
    } catch {
      if (mountedRef.current) {
        setLoi("Không thể tải dữ liệu so sánh cảm biến.");
        setThoiGianHienTai(Date.now());
      }
    } finally {
      requestingRef.current = false;

      if (mountedRef.current) {
        setDangTai(false);
        setDangLamMoi(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    void taiDuLieu();

    const interval = window.setInterval(() => {
      setThoiGianHienTai(Date.now());

      if (!document.hidden) {
        void taiDuLieu();
      }
    }, CHU_KY_CAP_NHAT);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [taiDuLieu]);

  const camBienA = camBien.find(
    (item) => item.maCamBien === maCamBienA
  );

  const camBienB = camBien.find(
    (item) => item.maCamBien === maCamBienB
  );

  const cungCamBien =
    maCamBienA !== null && maCamBienA === maCamBienB;

  const cungVung =
    camBienA !== undefined &&
    camBienB !== undefined &&
    camBienA.maVung === camBienB.maVung;

  const duLieuA = useMemo(
    () =>
      duLieu
        .filter(
          (item) => item.maCamBien === maCamBienA
        )
        .sort(
          (a, b) => layThoiGian(a) - layThoiGian(b)
        ),
    [duLieu, maCamBienA]
  );

  const duLieuB = useMemo(
    () =>
      duLieu
        .filter(
          (item) => item.maCamBien === maCamBienB
        )
        .sort(
          (a, b) => layThoiGian(a) - layThoiGian(b)
        ),
    [duLieu, maCamBienB]
  );

  const moiNhatA = duLieuA.at(-1) ?? null;
  const moiNhatB = duLieuB.at(-1) ?? null;

  const capDuLieu = useMemo(
    () => ghepDuLieu(duLieuA, duLieuB),
    [duLieuA, duLieuB]
  );

  const capMoiNhat =
    !cungCamBien && cungVung
      ? capDuLieu.at(-1) ?? null
      : null;

  const duLieuConMoi =
    capMoiNhat !== null &&
    camBienA?.trangThai === "DANG_HOAT_DONG" &&
    camBienB?.trangThai === "DANG_HOAT_DONG" &&
    thoiGianHienTai - layThoiGian(capMoiNhat.a) <=
      THOI_GIAN_DU_LIEU_MOI &&
    thoiGianHienTai - layThoiGian(capMoiNhat.b) <=
      THOI_GIAN_DU_LIEU_MOI &&
    thoiGianHienTai >= layThoiGian(capMoiNhat.a) &&
    thoiGianHienTai >= layThoiGian(capMoiNhat.b);

  const duChenhNhietDo = capMoiNhat
    ? Math.abs(
        capMoiNhat.a.nhietDo - capMoiNhat.b.nhietDo
      )
    : null;

  const duChenhDoAm = capMoiNhat
    ? Math.abs(
        capMoiNhat.a.doAm - capMoiNhat.b.doAm
      )
    : null;

  const vuotNguongSaiLech =
    duLieuConMoi &&
    ((duChenhNhietDo !== null &&
      duChenhNhietDo > NGUONG_NHIET_DO) ||
      (duChenhDoAm !== null &&
        duChenhDoAm > NGUONG_DO_AM));

  const duLieuBieuDo = useMemo<DuLieuBieuDo[]>(() => {
    if (cungCamBien || !cungVung) return [];

    return capDuLieu.slice(-20).map(({ a, b }) => ({
      nhan: new Date(
        Math.max(layThoiGian(a), layThoiGian(b))
      ).toLocaleTimeString("vi-VN"),
      nhietDoA: a.nhietDo,
      nhietDoB: b.nhietDo,
      doAmA: a.doAm,
      doAmB: b.doAm,
    }));
  }, [capDuLieu, cungCamBien, cungVung]);

  const coDuDuLieu =
    !cungCamBien && cungVung && capMoiNhat !== null;

  return (
    <div className="sosanh-page">
      <div className="sosanh-header">
        <div>
          <h1>So sánh cảm biến</h1>
          <p>
            Đối chiếu dữ liệu nhiệt độ và độ ẩm
            giữa các cảm biến trong kho.
          </p>
        </div>

        <button
          type="button"
          className="sosanh-btn sosanh-btn-primary"
          onClick={() => void taiDuLieu(true)}
          disabled={dangTai || dangLamMoi}
        >
          <RefreshCw size={17} />
          {dangLamMoi ? "Đang làm mới..." : "Làm mới"}
        </button>
      </div>

      {loi && <div className="sosanh-error">{loi}</div>}

      <section className="sosanh-panel">
        <div className="sosanh-panel-title">
          <h2>Lựa chọn cảm biến</h2>
        </div>

        <div className="sosanh-selectors">
          <label className="sosanh-field">
            <span>Cảm biến A</span>
            <select
              value={maCamBienA ?? ""}
              onChange={(event) =>
                setMaCamBienA(Number(event.target.value))
              }
            >
              {camBien.map((item) => (
                <option
                  key={item.maCamBien}
                  value={item.maCamBien}
                >
                  {item.tenCamBien} ({item.loaiCamBien})
                </option>
              ))}
            </select>
          </label>

          <ArrowLeftRight
            size={22}
            className="sosanh-swap-icon"
          />

          <label className="sosanh-field">
            <span>Cảm biến B</span>
            <select
              value={maCamBienB ?? ""}
              onChange={(event) =>
                setMaCamBienB(Number(event.target.value))
              }
            >
              {camBien.map((item) => (
                <option
                  key={item.maCamBien}
                  value={item.maCamBien}
                >
                  {item.tenCamBien} ({item.loaiCamBien})
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {cungCamBien && (
        <div className="sosanh-warning">
          Vui lòng chọn hai cảm biến khác nhau để so sánh.
        </div>
      )}

      {!cungCamBien && camBienA && camBienB && !cungVung && (
        <div className="sosanh-warning">
          Hai cảm biến thuộc hai vùng kho khác nhau.
          Hãy chọn cảm biến cùng vùng để đối chiếu điều kiện môi trường.
        </div>
      )}

      {!dangTai && !cungCamBien && cungVung && !coDuDuLieu && (
        <div className="sosanh-warning">
          Chưa có cặp dữ liệu được ghi nhận cách nhau
          không quá 10 giây.
        </div>
      )}

      {coDuDuLieu && !duLieuConMoi && (
        <div className="sosanh-warning">
          Dữ liệu so sánh hiện đã cũ hoặc cảm biến không
          ở trạng thái hoạt động. Các giá trị bên dưới
          chỉ dùng để tham khảo lịch sử.
        </div>
      )}

      {vuotNguongSaiLech && (
        <div className="sosanh-warning">
          Phát hiện chênh lệch lớn giữa hai cảm biến:
          nhiệt độ vượt 3°C hoặc độ ẩm vượt 15%.
          Đây là dấu hiệu cần kiểm tra, chưa đủ để
          kết luận cảm biến bị drift.
        </div>
      )}

      <div className="sosanh-cards">
        <div className="sosanh-card">
          <div className="sosanh-card-heading">
            <Activity size={22} />
            <h3>
              {camBienA?.tenCamBien ?? "Cảm biến A"}
            </h3>
          </div>

          <span className="sosanh-card-type">
            {camBienA?.loaiCamBien ?? "--"}
          </span>

          <p className="sosanh-card-time">
            {hienThiTrangThai(camBienA?.trangThai)}
          </p>

          <div className="sosanh-measure">
            <Thermometer size={20} />
            <span>Nhiệt độ</span>
            <strong>
              {moiNhatA
                ? `${dinhDangSo(moiNhatA.nhietDo)}°C`
                : "--"}
            </strong>
          </div>

          <div className="sosanh-measure">
            <Droplets size={20} />
            <span>Độ ẩm</span>
            <strong>
              {moiNhatA
                ? `${dinhDangSo(moiNhatA.doAm)}%`
                : "--"}
            </strong>
          </div>

          <p className="sosanh-card-time">
            {hienThiThoiGian(
              moiNhatA?.thoiGianGhiNhan ?? null
            )}
          </p>
        </div>

        <div className="sosanh-card">
          <div className="sosanh-card-heading">
            <Activity size={22} />
            <h3>
              {camBienB?.tenCamBien ?? "Cảm biến B"}
            </h3>
          </div>

          <span className="sosanh-card-type">
            {camBienB?.loaiCamBien ?? "--"}
          </span>

          <p className="sosanh-card-time">
            {hienThiTrangThai(camBienB?.trangThai)}
          </p>

          <div className="sosanh-measure">
            <Thermometer size={20} />
            <span>Nhiệt độ</span>
            <strong>
              {moiNhatB
                ? `${dinhDangSo(moiNhatB.nhietDo)}°C`
                : "--"}
            </strong>
          </div>

          <div className="sosanh-measure">
            <Droplets size={20} />
            <span>Độ ẩm</span>
            <strong>
              {moiNhatB
                ? `${dinhDangSo(moiNhatB.doAm)}%`
                : "--"}
            </strong>
          </div>

          <p className="sosanh-card-time">
            {hienThiThoiGian(
              moiNhatB?.thoiGianGhiNhan ?? null
            )}
          </p>
        </div>
      </div>

      <div className="sosanh-stats">
        <div className="sosanh-stat">
          <Thermometer size={22} />
          <div>
            <span>Chênh lệch nhiệt độ</span>
            <strong>
              {coDuDuLieu
                ? `${dinhDangSo(duChenhNhietDo)}°C`
                : "--"}
            </strong>
          </div>
        </div>

        <div className="sosanh-stat">
          <Droplets size={22} />
          <div>
            <span>Chênh lệch độ ẩm</span>
            <strong>
              {coDuDuLieu
                ? `${dinhDangSo(duChenhDoAm)}%`
                : "--"}
            </strong>
          </div>
        </div>
      </div>

      <section className="sosanh-panel">
        <div className="sosanh-panel-title">
          <h2>Biểu đồ nhiệt độ</h2>
        </div>

        <div className="sosanh-chart">
          {duLieuBieuDo.length === 0 ? (
            <p className="sosanh-empty">
              Chưa có dữ liệu biểu đồ.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={duLieuBieuDo}>
                <CartesianGrid
                  stroke="#334155"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="nhan"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#94a3b8" unit="°C" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="nhietDoA"
                  name={camBienA?.tenCamBien ?? "Cảm biến A"}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="nhietDoB"
                  name={camBienB?.tenCamBien ?? "Cảm biến B"}
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="sosanh-panel">
        <div className="sosanh-panel-title">
          <h2>Biểu đồ độ ẩm</h2>
        </div>

        <div className="sosanh-chart">
          {duLieuBieuDo.length === 0 ? (
            <p className="sosanh-empty">
              Chưa có dữ liệu biểu đồ.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={duLieuBieuDo}>
                <CartesianGrid
                  stroke="#334155"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="nhan"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#94a3b8" unit="%" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="doAmA"
                  name={camBienA?.tenCamBien ?? "Cảm biến A"}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="doAmB"
                  name={camBienB?.tenCamBien ?? "Cảm biến B"}
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <p className="sosanh-note">
        Dữ liệu được lấy từ tối đa 100 bản ghi mới nhất
        của hệ thống. Các cặp dữ liệu được ghép theo
        thời gian ghi nhận, với sai lệch tối đa 10 giây.
        Biểu đồ hiển thị tối đa 20 cặp gần nhất.
        Chênh lệch chỉ mang tính tham khảo.
        Cảnh báo NGHI_NGO_DRIFT chính thức được
        xác định bởi Backend sau 3 lần so sánh
        liên tiếp vượt ngưỡng.
      </p>
    </div>
  );
}
