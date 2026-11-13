
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Thermometer,
  Droplets,
  Cpu,
  BellRing,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

import { dashboardService } from '../services/dashboardService';
import type {
  Vung,
  CamBien,
  DuLieuCamBien,
  NgoaiLe,
} from '../types/dashboard';

import '../styles/dashboard.css';

export default function Dashboard() {
  const [vungs, setVungs] = useState<Vung[]>([]);
  const [camBiens, setCamBiens] = useState<CamBien[]>([]);
  const [duLieus, setDuLieus] = useState<DuLieuCamBien[]>([]);
  const [ngoaiLes, setNgoaiLes] = useState<NgoaiLe[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const requestingRef = useRef(false);
  const mountedRef = useRef(true);

  const loadDashboard = useCallback(async (manual = false) => {
    if (requestingRef.current) return;

    requestingRef.current = true;

    if (manual) {
      setRefreshing(true);
    }

    try {
      const [vungData, camBienData, duLieuData, ngoaiLeData] =
        await Promise.all([
          dashboardService.getVungs(),
          dashboardService.getCamBiens(),
          dashboardService.getDuLieuCamBiens(),
          dashboardService.getNgoaiLes(),
        ]);

      if (!mountedRef.current) return;

      setVungs(vungData);
      setCamBiens(camBienData);
      setDuLieus(duLieuData);
      setNgoaiLes(ngoaiLeData);
      setError('');
    } catch {
      if (mountedRef.current) {
        setError('Không thể tải dữ liệu Dashboard từ Backend.');
      }
    } finally {
      requestingRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    void loadDashboard();

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        void loadDashboard();
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  // Cam bien thuc te dang ket noi voi ESP32
  const dht11 = camBiens.find(
    (item) => item.maCamBien === 1
  );

  const sht30 = camBiens.find(
    (item) => item.maCamBien === 3
  );

  const monitoredSensors = [dht11, sht30].filter(
    (item): item is CamBien => item !== undefined
  );

  const activeSensors = camBiens.filter(
    (item) => item.trangThai === 'DANG_HOAT_DONG'
  ).length;

  const activeMonitoredSensors = monitoredSensors.filter(
    (item) => item.trangThai === 'DANG_HOAT_DONG'
  ).length;

  const newAlerts = ngoaiLes.filter(
    (item) => item.trangThai === 'MOI'
  ).length;

  // Lay du lieu moi nhat cua tung cam bien
  const latestDht = duLieus
    .filter((item) => item.maCamBien === 1)
    .sort(
      (a, b) =>
        new Date(b.thoiGianGhiNhan).getTime() -
        new Date(a.thoiGianGhiNhan).getTime()
    )[0];

  const latestSht = duLieus
    .filter((item) => item.maCamBien === 3)
    .sort(
      (a, b) =>
        new Date(b.thoiGianGhiNhan).getTime() -
        new Date(a.thoiGianGhiNhan).getTime()
    )[0];

  // Uu tien SHT30 lam gia tri tham chieu
  const latestData =
    sht30?.trangThai === 'DANG_HOAT_DONG' && latestSht
      ? latestSht
      : dht11?.trangThai === 'DANG_HOAT_DONG' && latestDht
        ? latestDht
        : undefined;

  // Gop du lieu theo moc thoi gian 5 giay
  const chartMap = new Map<
    number,
    {
      timestamp: number;
      time: string;
      nhietDoDht?: number;
      doAmDht?: number;
      nhietDoSht?: number;
      doAmSht?: number;
    }
  >();

  const sensorRecords = [...duLieus]
    .filter(
      (item) =>
        item.maCamBien === 1 || item.maCamBien === 3
    )
    .sort(
      (a, b) =>
        new Date(a.thoiGianGhiNhan).getTime() -
        new Date(b.thoiGianGhiNhan).getTime()
    )
    .slice(-80);

  for (const item of sensorRecords) {
    const timestamp = new Date(
      item.thoiGianGhiNhan
    ).getTime();

    if (!Number.isFinite(timestamp)) continue;

    const bucket = Math.floor(timestamp / 5000) * 5000;

    const existing = chartMap.get(bucket) ?? {
      timestamp: bucket,
      time: new Date(bucket).toLocaleTimeString('vi-VN'),
    };

    if (item.maCamBien === 1) {
      existing.nhietDoDht = item.nhietDo;
      existing.doAmDht = item.doAm;
    } else {
      existing.nhietDoSht = item.nhietDo;
      existing.doAmSht = item.doAm;
    }

    chartMap.set(bucket, existing);
  }

  const chartData = [...chartMap.values()]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-20);

  const recentAlerts = [...ngoaiLes]
    .sort(
      (a, b) =>
        new Date(b.thoiGianPhatHien).getTime() -
        new Date(a.thoiGianPhatHien).getTime()
    )
    .slice(0, 5);

  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'MAT_KET_NOI':
        return 'Mất kết nối';
      case 'NGHI_NGO_DRIFT':
        return 'Nghi ngờ drift';
      case 'VUOT_NGUONG_NHIET_DO':
        return 'Vượt ngưỡng nhiệt độ';
      case 'VUOT_NGUONG_DO_AM':
        return 'Vượt ngưỡng độ ẩm';
      default:
        return type;
    }
  };

  const getSensorStatus = (sensor?: CamBien) => {
    if (!sensor) return 'Chưa cấu hình';

    switch (sensor.trangThai) {
      case 'DANG_HOAT_DONG':
        return 'Đang hoạt động';
      case 'MAT_KET_NOI':
        return 'Mất kết nối';
      case 'CHUA_KET_NOI':
        return 'Chưa kết nối';
      default:
        return sensor.trangThai;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-top">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p>
            Theo dõi tình trạng môi trường kho và dữ liệu cảm biến
          </p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={() => void loadDashboard(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={17} />
          {refreshing ? 'Đang làm mới...' : 'Làm mới'}
        </button>
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-label">
                <Thermometer size={20} />
                <span>Nhiệt độ mới nhất</span>
              </div>

              <strong>
                {latestData
                  ? `${latestData.nhietDo.toFixed(1)} °C`
                  : '--'}
              </strong>

              <small>
                {latestData
                  ? `Nguồn: ${
                      latestData.maCamBien === 3
                        ? 'SHT30'
                        : 'DHT11'
                    }`
                  : 'Không có dữ liệu từ cảm biến đang hoạt động'}
              </small>
            </div>

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-label">
                <Droplets size={20} />
                <span>Độ ẩm mới nhất</span>
              </div>

              <strong>
                {latestData
                  ? `${latestData.doAm.toFixed(1)} %`
                  : '--'}
              </strong>

              <small>
                {latestData
                  ? new Date(
                      latestData.thoiGianGhiNhan
                    ).toLocaleString('vi-VN')
                  : 'Chưa có dữ liệu mới'}
              </small>
            </div>

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-label">
                <Cpu size={20} />
                <span>Cảm biến hoạt động</span>
              </div>

              <strong>
                {activeSensors}/{camBiens.length}
              </strong>

              <small>
                ESP32: {activeMonitoredSensors}/
                {monitoredSensors.length} cảm biến
                {' · '}
                {vungs.length} vùng kho
              </small>
            </div>

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-label">
                <BellRing size={20} />
                <span>Cảnh báo chưa xử lý</span>
              </div>

              <strong>{newAlerts}</strong>
              <small>Cảnh báo có trạng thái MỚI</small>
            </div>
          </div>

          <div className="dashboard-panel">
            <h2>Trạng thái cảm biến ESP32</h2>
            <p>
              Theo dõi kết nối DHT11 và SHT30 tại vùng kho số 1
            </p>

            <div className="dashboard-stats">
              {[dht11, sht30].map((sensor, index) => {
                const data =
                  index === 0 ? latestDht : latestSht;

                const active =
                  sensor?.trangThai === 'DANG_HOAT_DONG';

                return (
                  <div
                    className="dashboard-stat-card"
                    key={index === 0 ? 'dht11' : 'sht30'}
                  >
                    <div className="dashboard-stat-label">
                      <Cpu size={20} />
                      <span>
                        {sensor?.tenCamBien ??
                          (index === 0 ? 'DHT11' : 'SHT30')}
                      </span>
                    </div>

                    <strong
                      style={{
                        color: active ? '#4ade80' : '#f87171',
                        fontSize: 18,
                      }}
                    >
                      {getSensorStatus(sensor)}
                    </strong>

                    <small>
                      {data
                        ? `Lần cuối: ${new Date(
                            data.thoiGianGhiNhan
                          ).toLocaleString('vi-VN')}`
                        : 'Chưa có dữ liệu'}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dashboard-panel">
            <h2>Biểu đồ nhiệt độ và độ ẩm</h2>
            <p>
              So sánh dữ liệu thực tế của DHT11 và SHT30
              (20 mốc thời gian gần nhất)
            </p>

            {chartData.length === 0 ? (
              <div className="dashboard-empty">
                Chưa có dữ liệu cảm biến.
              </div>
            ) : (
              <div className="dashboard-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      stroke="#334155"
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11 }}
                    />

                    <YAxis stroke="#94a3b8" />

                    <Tooltip
                      contentStyle={{
                        background: '#172238',
                        border: '1px solid #334155',
                        borderRadius: 8,
                      }}
                    />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="nhietDoDht"
                      name="DHT11 - Nhiệt độ (°C)"
                      stroke="#fb923c"
                      strokeWidth={2}
                      connectNulls
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="nhietDoSht"
                      name="SHT30 - Nhiệt độ (°C)"
                      stroke="#facc15"
                      strokeWidth={2}
                      connectNulls
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="doAmDht"
                      name="DHT11 - Độ ẩm (%)"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      connectNulls
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="doAmSht"
                      name="SHT30 - Độ ẩm (%)"
                      stroke="#a78bfa"
                      strokeWidth={2}
                      connectNulls
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="dashboard-panel">
            <h2>Cảnh báo gần đây</h2>

            {recentAlerts.length === 0 ? (
              <div className="dashboard-empty">
                Chưa có cảnh báo.
              </div>
            ) : (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Mã cảnh báo</th>
                      <th>Cảm biến</th>
                      <th>Loại cảnh báo</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentAlerts.map((item) => (
                      <tr key={item.maNgoaiLe}>
                        <td>#{item.maNgoaiLe}</td>

                        <td>
                          {camBiens.find(
                            (cb) =>
                              cb.maCamBien === item.maCamBien
                          )?.tenCamBien ??
                            `#${item.maCamBien}`}
                        </td>

                        <td>
                          {getAlertLabel(item.loaiNgoaiLe)}
                        </td>

                        <td>
                          {new Date(
                            item.thoiGianPhatHien
                          ).toLocaleString('vi-VN')}
                        </td>

                        <td>
                          <span className="dashboard-alert-status">
                            {item.trangThai === 'MOI'
                              ? 'MỚI'
                              : item.trangThai === 'DA_XU_LY'
                                ? 'ĐÃ XỬ LÝ'
                                : item.trangThai}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
