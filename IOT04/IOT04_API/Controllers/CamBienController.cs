
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IOT04_API.Data;
using IOT04_API.DTOs;
using IOT04_API.Models;
using System.Security.Claims;

namespace IOT04_API.Controllers
{
    [Route("api/cambien")]
    [ApiController]
    [Authorize]
    public class CamBienController : ControllerBase
    {
        private readonly Iot04DbContext _context;

        public CamBienController(Iot04DbContext context)
        {
            _context = context;
        }

        // GET: api/cambien
        // ADMIN xem tat ca cam bien
        // USER chi xem cam bien thuoc vung kho duoc phan cong
        [HttpGet]
        public async Task<IActionResult> GetCamBien()
        {
            int? maTaiKhoan = LayMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return Unauthorized(new
                {
                    message = "Phiên đăng nhập không hợp lệ."
                });
            }

            var taiKhoan = await _context.TaiKhoans
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value &&
                    x.TrangThai);

            if (taiKhoan == null)
            {
                return Unauthorized(new
                {
                    message = "Tài khoản không tồn tại hoặc đã bị khóa."
                });
            }

            var query = _context.CamBiens.AsNoTracking();

            if (taiKhoan.VaiTro == "USER")
            {
                if (!taiKhoan.MaVung.HasValue)
                {
                    return Ok(Array.Empty<object>());
                }

                int maVung = taiKhoan.MaVung.Value;

                query = query.Where(cb =>
                    cb.MaVung == maVung);
            }
            else if (taiKhoan.VaiTro != "ADMIN")
            {
                return Forbid();
            }

            var danhSach = await query
                .Select(cb => new
                {
                    cb.MaCamBien,
                    cb.TenCamBien,
                    cb.LoaiCamBien,
                    cb.VaiTro,
                    cb.TrangThai,
                    cb.ThoiDiemDuLieuCuoi,
                    cb.ChuKyGuiDuLieu,
                    cb.NguongMatKetNoi,
                    cb.MaVung
                })
                .ToListAsync();

            return Ok(danhSach);
        }

        // POST: api/cambien
        // Chi ADMIN duoc them cam bien
        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> CreateCamBien(
            [FromBody] CamBienRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TenCamBien))
            {
                return BadRequest(new
                {
                    message = "Tên cảm biến không được để trống."
                });
            }

            if (!request.MaVung.HasValue)
            {
                return BadRequest(new
                {
                    message = "Vui lòng chọn vùng kho."
                });
            }

            if (!request.ChuKyGuiDuLieu.HasValue ||
                !request.NguongMatKetNoi.HasValue ||
                request.ChuKyGuiDuLieu.Value <= 0 ||
                request.NguongMatKetNoi.Value <=
                    request.ChuKyGuiDuLieu.Value)
            {
                return BadRequest(new
                {
                    message =
                        "Ngưỡng mất kết nối phải lớn hơn chu kỳ gửi dữ liệu."
                });
            }

            bool vungTonTai = await _context.Vungs
                .AnyAsync(v => v.MaVung == request.MaVung.Value);

            if (!vungTonTai)
            {
                return BadRequest(new
                {
                    message = "Vùng kho không tồn tại."
                });
            }

            int? maTaiKhoan = await LayMaAdminHopLe();

            if (maTaiKhoan == null)
            {
                return Forbid();
            }

            var camBien = new CamBien
            {
                TenCamBien = request.TenCamBien.Trim(),
                MaVung = request.MaVung.Value,
                MaTaiKhoan = maTaiKhoan.Value,
                LoaiCamBien = request.LoaiCamBien,
                VaiTro = request.VaiTro,
                ChuKyGuiDuLieu = request.ChuKyGuiDuLieu.Value,
                NguongMatKetNoi = request.NguongMatKetNoi.Value,
                TrangThai = "CHUA_KET_NOI",
                ThoiDiemDuLieuCuoi = null
            };

            _context.CamBiens.Add(camBien);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm cảm biến thành công.",
                maCamBien = camBien.MaCamBien
            });
        }

        // PUT: api/cambien/{id}
        // Chi ADMIN duoc cap nhat cam bien
        [HttpPut("{id:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> UpdateCamBien(
            int id,
            [FromBody] CamBienRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TenCamBien))
            {
                return BadRequest(new
                {
                    message = "Tên cảm biến không được để trống."
                });
            }

            if (!request.MaVung.HasValue)
            {
                return BadRequest(new
                {
                    message = "Vui lòng chọn vùng kho."
                });
            }

            if (!request.ChuKyGuiDuLieu.HasValue ||
                !request.NguongMatKetNoi.HasValue ||
                request.ChuKyGuiDuLieu.Value <= 0 ||
                request.NguongMatKetNoi.Value <=
                    request.ChuKyGuiDuLieu.Value)
            {
                return BadRequest(new
                {
                    message =
                        "Ngưỡng mất kết nối phải lớn hơn chu kỳ gửi dữ liệu."
                });
            }

            int? maTaiKhoan = await LayMaAdminHopLe();

            if (maTaiKhoan == null)
            {
                return Forbid();
            }

            var camBien = await _context.CamBiens
                .FirstOrDefaultAsync(cb => cb.MaCamBien == id);

            if (camBien == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy cảm biến."
                });
            }

            bool vungTonTai = await _context.Vungs
                .AnyAsync(v => v.MaVung == request.MaVung.Value);

            if (!vungTonTai)
            {
                return BadRequest(new
                {
                    message = "Vùng kho không tồn tại."
                });
            }

            camBien.TenCamBien = request.TenCamBien.Trim();
            camBien.MaVung = request.MaVung.Value;
            camBien.LoaiCamBien = request.LoaiCamBien;
            camBien.VaiTro = request.VaiTro;
            camBien.ChuKyGuiDuLieu = request.ChuKyGuiDuLieu.Value;
            camBien.NguongMatKetNoi = request.NguongMatKetNoi.Value;

            // Khong thay doi trang thai va thoi diem du lieu cuoi
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật cảm biến thành công."
            });
        }

        // DELETE: api/cambien/{id}
        // Chi ADMIN duoc xoa cam bien
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> DeleteCamBien(int id)
        {
            int? maTaiKhoan = await LayMaAdminHopLe();

            if (maTaiKhoan == null)
            {
                return Forbid();
            }

            var camBien = await _context.CamBiens
                .FirstOrDefaultAsync(cb => cb.MaCamBien == id);

            if (camBien == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy cảm biến."
                });
            }

            bool coDuLieu = await _context.DuLieuCamBiens
                .AnyAsync(dl => dl.MaCamBien == id);

            bool coNgoaiLe = await _context.NgoaiLes
                .AnyAsync(nl => nl.MaCamBien == id);

            if (coDuLieu || coNgoaiLe)
            {
                return Conflict(new
                {
                    message =
                        "Không thể xóa cảm biến đã có dữ liệu hoặc cảnh báo."
                });
            }

            _context.CamBiens.Remove(camBien);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa cảm biến thành công."
            });
        }

        // Lay ma tai khoan tu Cookie Authentication
        private int? LayMaTaiKhoan()
        {
            string? id = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            return int.TryParse(id, out int maTaiKhoan)
                ? maTaiKhoan
                : null;
        }

        // Kiem tra ADMIN van dang hoat dong trong database
        private async Task<int?> LayMaAdminHopLe()
        {
            int? maTaiKhoan = LayMaTaiKhoan();

            if (maTaiKhoan == null)
            {
                return null;
            }

            bool hopLe = await _context.TaiKhoans
                .AsNoTracking()
                .AnyAsync(x =>
                    x.MaTaiKhoan == maTaiKhoan.Value &&
                    x.TrangThai &&
                    x.VaiTro == "ADMIN");

            return hopLe ? maTaiKhoan : null;
        }
    }
}
