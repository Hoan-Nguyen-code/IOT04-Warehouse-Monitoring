
using System;
using System.Collections.Generic;
using IOT04_API.Models;
using Microsoft.EntityFrameworkCore;

namespace IOT04_API.Data;

public partial class Iot04DbContext : DbContext
{
    public Iot04DbContext(DbContextOptions<Iot04DbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<CamBien> CamBiens { get; set; }

    public virtual DbSet<DuLieuCamBien> DuLieuCamBiens { get; set; }

    public virtual DbSet<NgoaiLe> NgoaiLes { get; set; }

    public virtual DbSet<TaiKhoan> TaiKhoans { get; set; }

    public virtual DbSet<Vung> Vungs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CamBien>(entity =>
        {
            entity.HasKey(e => e.MaCamBien)
                .HasName("PK__CamBien__409F551743BB1C7D");

            entity.ToTable("CamBien");

            entity.Property(e => e.ChuKyGuiDuLieu)
                .HasDefaultValue(30);

            entity.Property(e => e.LoaiCamBien)
                .HasMaxLength(30)
                .HasDefaultValue("DHT11", "DF_CamBien_Loai");

            entity.Property(e => e.NguongMatKetNoi)
                .HasDefaultValue(90);

            entity.Property(e => e.TenCamBien)
                .HasMaxLength(100);

            entity.Property(e => e.TrangThai)
                .HasMaxLength(30)
                .HasDefaultValue("CHUA_KET_NOI");

            entity.Property(e => e.VaiTro)
                .HasMaxLength(30)
                .HasDefaultValue("CHINH", "DF_CamBien_VaiTro");

            entity.HasOne(d => d.MaTaiKhoanNavigation)
                .WithMany(p => p.CamBiens)
                .HasForeignKey(d => d.MaTaiKhoan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CamBien_TaiKhoan");

            entity.HasOne(d => d.MaVungNavigation)
                .WithMany(p => p.CamBiens)
                .HasForeignKey(d => d.MaVung)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CamBien_Vung");
        });

        modelBuilder.Entity<DuLieuCamBien>(entity =>
        {
            entity.HasKey(e => e.MaDuLieu)
                .HasName("PK__DuLieuCa__1859F88D91D1A323");

            entity.ToTable("DuLieuCamBien");

            entity.HasIndex(
                    e => new { e.MaCamBien, e.ThoiGianGhiNhan },
                    "IX_DuLieuCamBien_CamBien_ThoiGian")
                .IsDescending(false, true);

            entity.Property(e => e.ThoiGianGhiNhan)
                .HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.MaCamBienNavigation)
                .WithMany(p => p.DuLieuCamBiens)
                .HasForeignKey(d => d.MaCamBien)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DuLieu_CamBien");
        });

        modelBuilder.Entity<NgoaiLe>(entity =>
        {
            entity.HasKey(e => e.MaNgoaiLe)
                .HasName("PK__NgoaiLe__EC79016DDDBDF2DF");

            entity.ToTable("NgoaiLe");

            entity.HasIndex(
                    e => new { e.MaCamBien, e.ThoiGianPhatHien },
                    "IX_NgoaiLe_CamBien_ThoiGian")
                .IsDescending(false, true);

            entity.Property(e => e.LoaiNgoaiLe)
                .HasMaxLength(50);

            entity.Property(e => e.MoTa)
                .HasMaxLength(500);

            entity.Property(e => e.ThoiGianPhatHien)
                .HasDefaultValueSql("(sysdatetime())");

            entity.Property(e => e.TrangThai)
                .HasMaxLength(30)
                .HasDefaultValue("MOI");

            entity.HasOne(d => d.MaCamBienNavigation)
                .WithMany(p => p.NgoaiLes)
                .HasForeignKey(d => d.MaCamBien)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NgoaiLe_CamBien");

            entity.HasOne(d => d.MaDuLieuNavigation)
                .WithMany(p => p.NgoaiLes)
                .HasForeignKey(d => d.MaDuLieu)
                .HasConstraintName("FK_NgoaiLe_DuLieu");

            entity.HasOne(d => d.MaTaiKhoanNavigation)
                .WithMany(p => p.NgoaiLes)
                .HasForeignKey(d => d.MaTaiKhoan)
                .HasConstraintName("FK_NgoaiLe_TaiKhoan");
        });

        modelBuilder.Entity<TaiKhoan>(entity =>
        {
            entity.HasKey(e => e.MaTaiKhoan)
                .HasName("PK__TaiKhoan__AD7C6529C371E91A");

            entity.ToTable("TaiKhoan");

            entity.HasIndex(
                    e => e.TenDangNhap,
                    "UQ__TaiKhoan__55F68FC02973BC1B")
                .IsUnique();

            entity.Property(e => e.MatKhauHash)
                .HasMaxLength(255);

            entity.Property(e => e.TenDangNhap)
                .HasMaxLength(50);

            entity.Property(e => e.TrangThai)
                .HasDefaultValue(true);

            entity.Property(e => e.VaiTro)
                .HasMaxLength(20)
                .HasDefaultValue("USER");

            // Moi USER duoc phan cong toi da mot vung kho
            // Mot vung kho co the co nhieu USER
            entity.HasOne(d => d.MaVungNavigation)
                .WithMany()
                .HasForeignKey(d => d.MaVung)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_TaiKhoan_Vung");
        });

        modelBuilder.Entity<Vung>(entity =>
        {
            entity.HasKey(e => e.MaVung)
                .HasName("PK__Vung__BF118FFBEC276435");

            entity.ToTable("Vung");

            entity.Property(e => e.MoTa)
                .HasMaxLength(255);

            entity.Property(e => e.TenVung)
                .HasMaxLength(100);

            entity.HasOne(d => d.MaTaiKhoanNavigation)
                .WithMany(p => p.Vungs)
                .HasForeignKey(d => d.MaTaiKhoan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Vung_TaiKhoan");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
