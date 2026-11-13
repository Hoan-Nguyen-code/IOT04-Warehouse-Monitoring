
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AxiosError } from 'axios';
import {
  Warehouse,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react';

import { authService } from '../services/authService';
import { vungKhoService } from '../services/vungKhoService';
import type { VungRequest } from '../services/vungKhoService';
import type { Vung } from '../types/dashboard';

import '../styles/vungkho.css';

const emptyForm: VungRequest = {
  tenVung: '',
  moTa: '',
  nhietDoMin: 20,
  nhietDoMax: 30,
  doAmMin: 40,
  doAmMax: 80,
};

export default function VungKho() {
  const [vungs, setVungs] = useState<Vung[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VungRequest>({ ...emptyForm });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [data, user] = await Promise.all([
        vungKhoService.getAll(),
        authService.me(),
      ]);

      setVungs(data);
      setIsAdmin(user.vaiTro === 'ADMIN');
    } catch {
      setError('Không thể tải danh sách vùng kho.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setMessage('');
    setShowForm(true);
  };

  const openEdit = (vung: Vung) => {
    setEditingId(vung.maVung);
    setForm({
      tenVung: vung.tenVung,
      moTa: vung.moTa ?? '',
      nhietDoMin: vung.nhietDoMin,
      nhietDoMax: vung.nhietDoMax,
      doAmMin: vung.doAmMin,
      doAmMax: vung.doAmMax,
    });
    setError('');
    setMessage('');
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
  };

  const updateField = <K extends keyof VungRequest>(
    field: K,
    value: VungRequest[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdmin || saving) return;

    if (
      !form.tenVung.trim() ||
      !Number.isFinite(form.nhietDoMin) ||
      !Number.isFinite(form.nhietDoMax) ||
      !Number.isFinite(form.doAmMin) ||
      !Number.isFinite(form.doAmMax) ||
      form.nhietDoMin >= form.nhietDoMax ||
      form.doAmMin < 0 ||
      form.doAmMax > 100 ||
      form.doAmMin >= form.doAmMax
    ) {
      setError('Vui lòng kiểm tra tên vùng và các ngưỡng nhiệt độ, độ ẩm.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...form,
        tenVung: form.tenVung.trim(),
      };

      if (editingId === null) {
        await vungKhoService.create(payload);
        setMessage('Thêm vùng kho thành công.');
      } else {
        await vungKhoService.update(editingId, payload);
        setMessage('Cập nhật vùng kho thành công.');
      }

      setShowForm(false);
      await loadData();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message ??
          'Không thể lưu vùng kho. Vui lòng thử lại.'
        );
      } else {
        setError('Đã xảy ra lỗi khi lưu vùng kho.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vung: Vung) => {
    if (!isAdmin || saving) return;

    const confirmed = window.confirm(
      `Ông có chắc muốn xóa "${vung.tenVung}" không?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');

      await vungKhoService.remove(vung.maVung);
      setMessage('Xóa vùng kho thành công.');
      await loadData();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message ??
          'Không thể xóa vùng kho.'
        );
      } else {
        setError('Đã xảy ra lỗi khi xóa vùng kho.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vung-page">
      <div className="vung-top">
        <div>
          <h1>Quản lý vùng kho</h1>
          <p>Quản lý khu vực và thiết lập ngưỡng giám sát môi trường.</p>
        </div>

        <div className="vung-actions">
          <button
            className="vung-btn vung-btn-secondary"
            onClick={() => void loadData()}
            disabled={loading || saving}
          >
            <RefreshCw size={17} />
            Làm mới
          </button>

          {isAdmin && (
            <button
              className="vung-btn vung-btn-primary"
              onClick={openCreate}
              disabled={saving}
            >
              <Plus size={17} />
              Thêm vùng kho
            </button>
          )}
        </div>
      </div>

      {message && <div className="vung-success">{message}</div>}
      {error && <div className="vung-error" role="alert">{error}</div>}

      <div className="vung-panel">
        <div className="vung-panel-title">
          <Warehouse size={20} />
          <h2>Danh sách vùng kho ({vungs.length})</h2>
        </div>

        {loading ? (
          <p className="vung-empty">Đang tải dữ liệu...</p>
        ) : vungs.length === 0 ? (
          <p className="vung-empty">Chưa có vùng kho nào.</p>
        ) : (
          <div className="vung-table-wrap">
            <table className="vung-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên vùng kho</th>
                  <th>Mô tả</th>
                  <th>Nhiệt độ (°C)</th>
                  <th>Độ ẩm (%)</th>
                  {isAdmin && <th>Thao tác</th>}
                </tr>
              </thead>

              <tbody>
                {vungs.map((vung) => (
                  <tr key={vung.maVung}>
                    <td>#{vung.maVung}</td>
                    <td className="vung-name">{vung.tenVung}</td>
                    <td>{vung.moTa || '—'}</td>
                    <td>
                      {vung.nhietDoMin} – {vung.nhietDoMax}
                    </td>
                    <td>
                      {vung.doAmMin} – {vung.doAmMax}
                    </td>

                    {isAdmin && (
                      <td>
                        <div className="vung-row-actions">
                          <button
                            className="vung-icon-btn"
                            title="Chỉnh sửa"
                            aria-label={`Chỉnh sửa ${vung.tenVung}`}
                            onClick={() => openEdit(vung)}
                            disabled={saving}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            className="vung-icon-btn vung-delete"
                            title="Xóa"
                            aria-label={`Xóa ${vung.tenVung}`}
                            onClick={() => void handleDelete(vung)}
                            disabled={saving}
                          >
                            <Trash2 size={17} />
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

      {showForm && (
        <div className="vung-modal-backdrop">
          <div
            className="vung-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vung-modal-title"
          >
            <div className="vung-modal-header">
              <h2 id="vung-modal-title">
                {editingId === null ? 'Thêm vùng kho' : 'Chỉnh sửa vùng kho'}
              </h2>
              <button
                className="vung-icon-btn"
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="vung-form-body">
                <label className="vung-field">
                  <span>Tên vùng kho</span>
                  <input
                    required
                    maxLength={100}
                    value={form.tenVung}
                    onChange={(e) => updateField('tenVung', e.target.value)}
                    placeholder="Ví dụ: Kho bảo quản số 1"
                  />
                </label>

                <label className="vung-field">
                  <span>Mô tả</span>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.moTa}
                    onChange={(e) => updateField('moTa', e.target.value)}
                    placeholder="Mô tả khu vực kho..."
                  />
                </label>

                <div className="vung-form-grid">
                  {([
                    ['nhietDoMin', 'Nhiệt độ tối thiểu (°C)'],
                    ['nhietDoMax', 'Nhiệt độ tối đa (°C)'],
                    ['doAmMin', 'Độ ẩm tối thiểu (%)'],
                    ['doAmMax', 'Độ ẩm tối đa (%)'],
                  ] as const).map(([field, label]) => (
                    <label className="vung-field" key={field}>
                      <span>{label}</span>
                      <input
                        type="number"
                        step="0.1"
                        required
                        min={field.startsWith('doAm') ? 0 : undefined}
                        max={field.startsWith('doAm') ? 100 : undefined}
                        value={form[field]}
                        onChange={(e) =>
                          updateField(field, e.target.valueAsNumber)
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="vung-modal-footer">
                <button
                  type="button"
                  className="vung-btn vung-btn-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="vung-btn vung-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu vùng kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
