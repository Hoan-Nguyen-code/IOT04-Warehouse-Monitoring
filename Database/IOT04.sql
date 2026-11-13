CREATE DATABASE IOT04_QuanLyKho;
GO

USE IOT04_QuanLyKho;
GO
-- 1. TÀI KHOẢN
CREATE TABLE TaiKhoan (
    MaTaiKhoan INT IDENTITY(1,1) PRIMARY KEY,
    TenDangNhap NVARCHAR(50) NOT NULL UNIQUE,
    MatKhauHash NVARCHAR(255) NOT NULL,
    VaiTro NVARCHAR(20) NOT NULL DEFAULT 'USER',
    TrangThai BIT NOT NULL DEFAULT 1
);
GO

-- 2. VÙNG GIÁM SÁT
CREATE TABLE Vung (
    MaVung INT IDENTITY(1,1) PRIMARY KEY,
    TenVung NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(255),

    NhietDoMin FLOAT NOT NULL,
    NhietDoMax FLOAT NOT NULL,
    DoAmMin FLOAT NOT NULL,
    DoAmMax FLOAT NOT NULL,

    MaTaiKhoan INT NOT NULL,

    CONSTRAINT FK_Vung_TaiKhoan
        FOREIGN KEY (MaTaiKhoan)
        REFERENCES TaiKhoan(MaTaiKhoan),

    CONSTRAINT CK_Vung_NhietDo
        CHECK (NhietDoMin < NhietDoMax),

    CONSTRAINT CK_Vung_DoAm
        CHECK (
            DoAmMin >= 0 AND
            DoAmMax <= 100 AND
            DoAmMin < DoAmMax
        )
);
GO

-- 3. CẢM BIẾN
CREATE TABLE CamBien (
    MaCamBien INT IDENTITY(1,1) PRIMARY KEY,
    TenCamBien NVARCHAR(100) NOT NULL,
    TrangThai NVARCHAR(30) NOT NULL DEFAULT 'CHUA_KET_NOI',

    ThoiDiemDuLieuCuoi DATETIME2 NULL,
    ChuKyGuiDuLieu INT NOT NULL DEFAULT 30,
    NguongMatKetNoi INT NOT NULL DEFAULT 90,

    MaVung INT NOT NULL,
    MaTaiKhoan INT NOT NULL,

    CONSTRAINT FK_CamBien_Vung
        FOREIGN KEY (MaVung)
        REFERENCES Vung(MaVung),

    CONSTRAINT FK_CamBien_TaiKhoan
        FOREIGN KEY (MaTaiKhoan)
        REFERENCES TaiKhoan(MaTaiKhoan),

    CONSTRAINT CK_CamBien_ThoiGian
        CHECK (
            ChuKyGuiDuLieu > 0 AND
            NguongMatKetNoi > ChuKyGuiDuLieu
        )
);
GO

-- 4. DỮ LIỆU CẢM BIẾN
CREATE TABLE DuLieuCamBien (
    MaDuLieu BIGINT IDENTITY(1,1) PRIMARY KEY,
    MaCamBien INT NOT NULL,

    NhietDo FLOAT NOT NULL,
    DoAm FLOAT NOT NULL,
    ThoiGianGhiNhan DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_DuLieu_CamBien
        FOREIGN KEY (MaCamBien)
        REFERENCES CamBien(MaCamBien),

    CONSTRAINT CK_DuLieu_DoAm
        CHECK (DoAm BETWEEN 0 AND 100)
);
GO

-- 5. NGOẠI LỆ / CẢNH BÁO
CREATE TABLE NgoaiLe (
    MaNgoaiLe BIGINT IDENTITY(1,1) PRIMARY KEY,

    MaCamBien INT NOT NULL,
    MaDuLieu BIGINT NULL,
    MaTaiKhoan INT NULL,

    LoaiNgoaiLe NVARCHAR(50) NOT NULL,
    MoTa NVARCHAR(500),
    ThoiGianPhatHien DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    TrangThai NVARCHAR(30) NOT NULL DEFAULT 'MOI',

    CONSTRAINT FK_NgoaiLe_CamBien
        FOREIGN KEY (MaCamBien)
        REFERENCES CamBien(MaCamBien),

    CONSTRAINT FK_NgoaiLe_DuLieu
        FOREIGN KEY (MaDuLieu)
        REFERENCES DuLieuCamBien(MaDuLieu),

    CONSTRAINT FK_NgoaiLe_TaiKhoan
        FOREIGN KEY (MaTaiKhoan)
        REFERENCES TaiKhoan(MaTaiKhoan)
);
GO

CREATE INDEX IX_DuLieuCamBien_CamBien_ThoiGian
ON DuLieuCamBien (MaCamBien, ThoiGianGhiNhan DESC);
GO

CREATE INDEX IX_NgoaiLe_CamBien_ThoiGian
ON NgoaiLe (MaCamBien, ThoiGianPhatHien DESC);
GO

SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

USE IOT04_QuanLyKho;
GO

-- Tạo tài khoản mẫu
-- Hash này chỉ là dữ liệu giả để kiểm thử CSDL,
-- chưa dùng để đăng nhập thực tế.
INSERT INTO TaiKhoan
    (TenDangNhap, MatKhauHash, VaiTro, TrangThai)
VALUES
    ('admin', 'HASH_MAU_CHUA_HOP_LE', 'ADMIN', 1);

-- Tạo vùng giám sát
INSERT INTO Vung
    (TenVung, MoTa, NhietDoMin, NhietDoMax,
     DoAmMin, DoAmMax, MaTaiKhoan)
VALUES
    (N'Kho số 1', N'Khu vực giám sát nhiệt độ và độ ẩm',
     20, 30, 40, 80, 1);

-- Tạo cảm biến DHT11
INSERT INTO CamBien
    (TenCamBien, TrangThai, ChuKyGuiDuLieu,
     NguongMatKetNoi, MaVung, MaTaiKhoan)
VALUES
    ('DHT11-01', 'CHUA_KET_NOI', 30, 90, 1, 1);
GO

SELECT
    cb.MaCamBien,
    cb.TenCamBien,
    cb.TrangThai,
    v.TenVung,
    tk.TenDangNhap
FROM CamBien cb
JOIN Vung v ON cb.MaVung = v.MaVung
JOIN TaiKhoan tk ON cb.MaTaiKhoan = tk.MaTaiKhoan;

INSERT INTO DuLieuCamBien
    (MaCamBien, NhietDo, DoAm)
VALUES
    (1, 27.5, 65),
    (1, 29.0, 70),
    (1, 32.5, 75);
GO

SELECT *
FROM DuLieuCamBien
ORDER BY ThoiGianGhiNhan DESC;

USE IOT04_QuanLyKho;
GO

ALTER TABLE CamBien
ADD
    LoaiCamBien NVARCHAR(30) NOT NULL
        CONSTRAINT DF_CamBien_Loai DEFAULT 'DHT11',
    VaiTro NVARCHAR(30) NOT NULL
        CONSTRAINT DF_CamBien_VaiTro DEFAULT 'CHINH';
GO

ALTER TABLE CamBien
ADD CONSTRAINT CK_CamBien_VaiTro
CHECK (VaiTro IN ('CHINH', 'THAM_CHIEU'));
GO

SELECT
    MaCamBien,
    TenCamBien,
    LoaiCamBien,
    VaiTro
FROM CamBien;


/*test*/
USE IOT04_QuanLyKho;

SELECT TOP 10
    MaNgoaiLe,
    MaCamBien,
    MaDuLieu,
    LoaiNgoaiLe,
    MoTa,
    ThoiGianPhatHien,
    TrangThai
FROM NgoaiLe
ORDER BY MaNgoaiLe DESC;


SELECT
    cc.name AS TenRangBuoc,
    cc.definition AS DieuKien
FROM sys.check_constraints AS cc
WHERE cc.parent_object_id = OBJECT_ID('dbo.CamBien')
  AND cc.name = 'CK_CamBien_VaiTro';

SELECT VaiTro, COUNT(*) AS SoLuong
FROM TaiKhoan
GROUP BY VaiTro;

SELECT
    cc.name AS TenRangBuoc,
    cc.definition AS DieuKien
FROM sys.check_constraints AS cc
WHERE cc.parent_object_id = OBJECT_ID('dbo.TaiKhoan');


USE IOT04_QuanLyKho;
GO

-- Them cot MaVung vao bang TaiKhoan
IF COL_LENGTH('dbo.TaiKhoan', 'MaVung') IS NULL
BEGIN
    ALTER TABLE dbo.TaiKhoan
    ADD MaVung INT NULL;
END
GO

-- Tao khoa ngoai lien ket TaiKhoan voi Vung
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_TaiKhoan_Vung'
      AND parent_object_id = OBJECT_ID('dbo.TaiKhoan')
)
BEGIN
    ALTER TABLE dbo.TaiKhoan
    ADD CONSTRAINT FK_TaiKhoan_Vung
    FOREIGN KEY (MaVung)
    REFERENCES dbo.Vung(MaVung);
END
GO

-- Kiem tra ket qua
SELECT
    MaTaiKhoan,
    TenDangNhap,
    VaiTro,
    TrangThai,
    MaVung
FROM dbo.TaiKhoan;

USE IOT04_QuanLyKho;
GO

SELECT MaVung, TenVung
FROM dbo.Vung
ORDER BY MaVung;


USE IOT04_QuanLyKho;
GO

SELECT
    MaCamBien,
    TenCamBien,
    LoaiCamBien,
    VaiTro,
    MaVung,
    TrangThai,
    ChuKyGuiDuLieu,
    NguongMatKetNoi
FROM CamBien
ORDER BY MaCamBien;

USE IOT04_QuanLyKho;
GO

SELECT TOP 10
    MaDuLieu,
    MaCamBien,
    NhietDo,
    DoAm,
    ThoiGianGhiNhan
FROM DuLieuCamBien
WHERE MaCamBien IN (1, 3)
ORDER BY MaDuLieu DESC;

USE IOT04_QuanLyKho;
GO

SELECT TOP 20
    nl.MaNgoaiLe,
    cb.TenCamBien,
    nl.LoaiNgoaiLe,
    nl.MoTa,
    nl.ThoiGianPhatHien,
    nl.TrangThai
FROM NgoaiLe nl
JOIN CamBien cb
    ON nl.MaCamBien = cb.MaCamBien
WHERE nl.MaCamBien IN (1, 3)
ORDER BY nl.MaNgoaiLe DESC;

/*Test khi rut esp*/
USE IOT04_QuanLyKho;
GO

SELECT
    MaCamBien,
    TenCamBien,
    TrangThai,
    ThoiDiemDuLieuCuoi,
    NguongMatKetNoi,
    DATEDIFF(
        SECOND,
        ThoiDiemDuLieuCuoi,
        GETDATE()
    ) AS SoGiayKhongNhanDuLieu
FROM CamBien
WHERE MaCamBien IN (1, 3);

SELECT
    MaNgoaiLe,
    MaCamBien,
    LoaiNgoaiLe,
    MoTa,
    TrangThai,
    ThoiGianPhatHien
FROM NgoaiLe
WHERE MaCamBien IN (1, 3)
  AND LoaiNgoaiLe = 'MAT_KET_NOI'
ORDER BY MaNgoaiLe DESC;

/*sau khi cam day*/
SELECT
    MaCamBien,
    TenCamBien,
    TrangThai,
    ThoiDiemDuLieuCuoi
FROM CamBien
WHERE MaCamBien IN (1, 3);

SELECT
    MaCamBien,
    NhietDo,
    DoAm,
    ThoiGianGhiNhan
FROM DuLieuCamBien
WHERE MaDuLieu IN (
    SELECT MAX(MaDuLieu)
    FROM DuLieuCamBien
    WHERE MaCamBien IN (1, 3)
    GROUP BY MaCamBien
);

SELECT TOP 10
    MaNgoaiLe,
    MaCamBien,
    LoaiNgoaiLe,
    MoTa,
    TrangThai,
    ThoiGianPhatHien
FROM NgoaiLe
WHERE LoaiNgoaiLe = 'NGHI_NGO_DRIFT'
ORDER BY MaNgoaiLe DESC;