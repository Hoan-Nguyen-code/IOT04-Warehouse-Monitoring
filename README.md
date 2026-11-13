
# IOT-04 – HỆ THỐNG THEO DÕI ĐIỀU KIỆN MÔI TRƯỜNG KHO BẰNG CẢM BIẾN

## 1. THÔNG TIN SINH VIÊN

- Họ và tên: Nguyễn Đức Hoan
- Mã số sinh viên: 1250080056
- Lớp: CNPM1
- Môn học: Phương pháp phát triển phần mềm hướng đối tượng (OOASD)
- Tên đề tài: Xây dựng hệ thống theo dõi điều kiện môi trường kho bằng cảm biến
- Mã đề tài: IOT-04
- Hình thức thực hiện: Đồ án cuối kỳ

## 2. GIỚI THIỆU ĐỀ TÀI

Đề tài xây dựng hệ thống IoT hỗ trợ theo dõi nhiệt độ, độ ẩm và tình trạng hoạt động của các cảm biến trong môi trường kho.

Hệ thống sử dụng ESP32 kết hợp cảm biến DHT11 và SHT30 để thu thập dữ liệu môi trường. Dữ liệu được truyền qua giao thức MQTT đến Backend ASP.NET Core, lưu trữ trong SQL Server và hiển thị trên giao diện Web React.

Hệ thống hỗ trợ quản lý cảm biến, quản lý vùng kho, theo dõi dữ liệu theo thời gian, phát hiện bất thường và cảnh báo khi điều kiện môi trường vượt ngưỡng cho phép.

## 3. MÔI TRƯỜNG VÀ CÔNG NGHỆ SỬ DỤNG

### 3.1. Phần cứng

- Vi điều khiển: ESP32 NodeMCU LuaNode32
- Cảm biến nhiệt độ và độ ẩm: DHT11
- Cảm biến nhiệt độ và độ ẩm tham chiếu: SHT30
- Kết nối mạng: Wi-Fi
- Giao tiếp DHT11: GPIO4
- Giao tiếp SHT30: I2C (SDA GPIO21, SCL GPIO22)

### 3.2. Phần mềm

| Thành phần | Công nghệ / Phiên bản |
|---|---|
| Hệ điều hành phát triển | Windows |
| Vi điều khiển | ESP32 |
| Giao thức truyền dữ liệu | MQTT |
| MQTT Broker | Eclipse Mosquitto |
| Backend | ASP.NET Core Web API – .NET 10 |
| ORM | Entity Framework Core |
| Cơ sở dữ liệu | Microsoft SQL Server |
| Frontend | React + TypeScript |
| Công cụ xây dựng Frontend | Vite |
| Thư viện biểu đồ | Recharts |
| Công cụ lập trình | Visual Studio Code | Arduino IDE|
| Quản lý mã nguồn | Git và GitHub |


Lưu ý: Phiên bản cụ thể của SQL Server, Mosquitto, Node.js và các thư viện được kiểm tra theo môi trường cài đặt và các tệp cấu hình của project.

## 4. KIẾN TRÚC HỆ THỐNG

Hệ thống được xây dựng theo mô hình gồm các thành phần:

1. ESP32 và cảm biến DHT11, SHT30.
2. MQTT Broker tiếp nhận dữ liệu từ ESP32.
3. Backend ASP.NET Core xử lý và lưu dữ liệu.
4. SQL Server lưu trữ thông tin hệ thống.
5. Frontend React hiển thị và quản lý dữ liệu.

Luồng hoạt động:

ESP32 + DHT11/SHT30
        |
        v
     Wi-Fi
        |
        v
 Mosquitto MQTT
        |
        v
 ASP.NET Core Web API
        |
        v
    SQL Server
        |
        v
   React Frontend

ESP32 thực hiện thu thập dữ liệu cảm biến và gửi dữ liệu định kỳ khoảng 5 giây qua MQTT.

Backend tiếp nhận, xử lý dữ liệu, cập nhật trạng thái cảm biến và phát hiện các trường hợp bất thường.

Frontend sử dụng API để hiển thị dữ liệu và cung cấp các chức năng quản lý.

## 5. NỘI DUNG ĐÃ THỰC HIỆN

### 5.1. Xây dựng hệ thống thu thập dữ liệu IoT

- Kết nối ESP32 với Wi-Fi.
- Kết nối cảm biến DHT11 và SHT30 với ESP32.
- Đọc nhiệt độ và độ ẩm từ hai cảm biến.
- Gửi dữ liệu định kỳ qua giao thức MQTT.
- Sử dụng các MQTT Topic:
  - iot04/sensors/dht11
  - iot04/sensors/sht30

### 5.2. Xây dựng Backend ASP.NET Core

- Xây dựng Web API phục vụ hệ thống.
- Kết nối cơ sở dữ liệu SQL Server.
- Sử dụng Entity Framework Core Database First.
- Tiếp nhận và lưu dữ liệu cảm biến từ MQTT.
- Quản lý thông tin cảm biến.
- Quản lý vùng kho.
- Quản lý dữ liệu đo.
- Quản lý và xử lý cảnh báo.
- Kiểm tra trạng thái kết nối của cảm biến.
- Phát hiện chênh lệch bất thường giữa cảm biến chính và cảm biến tham chiếu.
- Cung cấp dữ liệu cho Frontend React.

### 5.3. Xây dựng Frontend React

Các chức năng giao diện đã triển khai:

- Đăng nhập và phân quyền ADMIN/USER.
- Dashboard theo dõi tổng quan môi trường kho.
- Quản lý vùng kho.
- Quản lý cảm biến.
- Theo dõi lịch sử dữ liệu cảm biến.
- Hiển thị và xử lý cảnh báo.
- So sánh dữ liệu giữa các cảm biến.
- Quản lý tài khoản người dùng.
- Hiển thị biểu đồ nhiệt độ và độ ẩm.
- Tự động cập nhật dữ liệu trên các trang theo dõi.

### 5.4. Xây dựng chức năng cảnh báo

Hệ thống hỗ trợ phát hiện:

- Nhiệt độ vượt ngưỡng cho phép.
- Độ ẩm vượt ngưỡng cho phép.
- Cảm biến mất kết nối.
- Chênh lệch bất thường giữa DHT11 và SHT30 (nghi ngờ drift).

Đối với phát hiện drift, hệ thống so sánh dữ liệu của cảm biến chính và cảm biến tham chiếu.

Các điều kiện kiểm tra bao gồm:

- Hai mẫu dữ liệu có thời điểm ghi nhận chênh lệch không quá 10 giây.
- Dữ liệu được ghi nhận gần thời điểm hiện tại.
- Chênh lệch nhiệt độ lớn hơn 3°C hoặc độ ẩm lớn hơn 15%RH.
- Điều kiện bất thường xuất hiện trong 3 lần so sánh liên tiếp.

Khi thỏa mãn điều kiện, hệ thống ghi nhận cảnh báo nghi ngờ drift.

## 6. KẾT QUẢ ĐẠT ĐƯỢC

Sau quá trình triển khai và kiểm thử, hệ thống đã đạt được các kết quả:

- ESP32 đọc được dữ liệu thực tế từ DHT11 và SHT30.
- Dữ liệu được gửi đến MQTT Broker.
- Backend tiếp nhận và lưu dữ liệu vào SQL Server.
- React hiển thị dữ liệu từ Backend.
- Dashboard cập nhật dữ liệu theo chu kỳ.
- Các chức năng quản lý cảm biến và vùng kho được triển khai.
- Lịch sử dữ liệu được hiển thị trên giao diện.
- Hệ thống phát hiện các trường hợp vượt ngưỡng.
- Hệ thống phát hiện cảm biến mất kết nối.
- Hệ thống ghi nhận cảnh báo nghi ngờ drift.
- Hệ thống tiếp tục nhận dữ liệu khi cảm biến kết nối trở lại.
- Người dùng có thể theo dõi và xử lý cảnh báo trên giao diện.

Kết quả cho thấy hệ thống đã thực hiện được luồng xử lý dữ liệu IoT từ phần cứng đến giao diện Web.

## 7. LỖI GẶP PHẢI VÀ CÁCH KHẮC PHỤC

### 7.1. Cảm biến không gửi được dữ liệu đến MQTT Broker

Nguyên nhân cần kiểm tra:

- ESP32 chưa kết nối được Wi-Fi.
- Địa chỉ IP MQTT Broker không chính xác.
- MQTT Broker chưa hoạt động.
- Máy chạy Broker và ESP32 không thể kết nối mạng với nhau.

Cách khắc phục:

- Kiểm tra cấu hình Wi-Fi trên ESP32.
- Kiểm tra địa chỉ IP và cổng MQTT.
- Kiểm tra trạng thái Mosquitto.
- Kiểm tra kết nối mạng và quy tắc Firewall.

### 7.2. Frontend không hiển thị dữ liệu mới

Nguyên nhân cần kiểm tra:

- Backend chưa hoạt động.
- API không trả về dữ liệu.
- Frontend chưa cập nhật dữ liệu mới.
- Cấu hình địa chỉ Backend không chính xác.

Cách khắc phục:

- Kiểm tra trạng thái ASP.NET Core Web API.
- Kiểm tra dữ liệu trả về từ API.
- Kiểm tra kết nối Frontend và Backend.
- Sử dụng cơ chế tự động tải lại dữ liệu định kỳ.

### 7.3. Cảm biến mất kết nối

Tình huống kiểm thử:

Ngắt nguồn ESP32 để mô phỏng trường hợp cảm biến không tiếp tục gửi dữ liệu.

Kết quả:

- Backend phát hiện cảm biến không gửi dữ liệu trong khoảng thời gian quy định.
- Hệ thống cập nhật trạng thái cảm biến.
- Hệ thống ghi nhận cảnh báo mất kết nối.
- Khi ESP32 hoạt động trở lại, hệ thống tiếp tục nhận dữ liệu.

### 7.4. Cảnh báo bị ghi nhận lặp lại

Vấn đề:

Khi điều kiện bất thường tồn tại liên tục, hệ thống có thể ghi nhận nhiều cảnh báo giống nhau.

Cách khắc phục:

Bổ sung cơ chế kiểm tra cảnh báo hiện có để hạn chế tạo các cảnh báo trùng lặp chưa được xử lý.

### 7.5. Chênh lệch dữ liệu giữa DHT11 và SHT30

Vấn đề:

Hai cảm biến có thể ghi nhận giá trị khác nhau do sai số đo hoặc điều kiện môi trường.

Cách xử lý:

- So sánh dữ liệu theo thời gian ghi nhận.
- Kiểm tra độ mới của dữ liệu.
- Sử dụng ngưỡng chênh lệch nhiệt độ và độ ẩm.
- Yêu cầu nhiều lần so sánh bất thường liên tiếp trước khi tạo cảnh báo drift.

## 8. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY PROJECT

### 8.1. Yêu cầu chuẩn bị

Máy tính cần cài đặt:

- .NET SDK 10
- Microsoft SQL Server
- SQL Server Management Studio hoặc công cụ quản lý SQL Server tương đương
- Node.js và npm
- Mosquitto MQTT Broker
- Visual Studio Code hoặc IDE phù hợp
- Arduino IDE

Đối với phần cứng:

- ESP32
- DHT11
- SHT30
- Cáp USB và nguồn điện phù hợp
- Mạng Wi-Fi

### 8.2. Khởi tạo cơ sở dữ liệu

1. Mở SQL Server Management Studio.
2. Kết nối SQL Server.
3. Tạo hoặc khôi phục cơ sở dữ liệu IOT04_QuanLyKho bằng tài nguyên SQL đi kèm project.
4. Kiểm tra các bảng dữ liệu.
5. Cập nhật connection string của Backend theo SQL Server trên máy kiểm tra.

Các bảng dữ liệu chính:

- CamBien
- DuLieuCamBien
- NgoaiLe
- Vung

Ngoài ra, cơ sở dữ liệu còn có các bảng phục vụ những chức năng quản lý khác của hệ thống.

### 8.3. Chạy MQTT Broker

Khởi động Mosquitto MQTT Broker.

Cổng MQTT sử dụng trong môi trường phát triển:

1883

Cấu hình ESP32 kết nối đến địa chỉ IP của máy chạy MQTT Broker.

Lưu ý: Địa chỉ 172.20.10.3 là địa chỉ sử dụng trong môi trường thử nghiệm, không phải địa chỉ cố định cho mọi máy.

Khi chạy lại trên máy khác, cần thay địa chỉ MQTT Broker theo mạng thực tế.

### 8.4. Chạy Backend ASP.NET Core

Mở Terminal tại thư mục Backend:

```bash
cd IOT04/IOT04_API
dotnet restore
dotnet run
```

Địa chỉ Backend trong môi trường phát triển:

http://localhost:5184

Trước khi chạy, cần kiểm tra:

- Connection string SQL Server.
- Cấu hình MQTT.
- Các thông số môi trường cần thiết.
- Cấu hình CORS nếu Frontend chạy trên địa chỉ khác.

### 8.5. Chạy Frontend React

Mở Terminal tại thư mục Frontend:

```bash
cd IOT04/IOT04_Frontend
npm install
npm run dev
```

Địa chỉ Frontend trong môi trường phát triển:

http://localhost:5173

Mở trình duyệt và truy cập địa chỉ trên để sử dụng hệ thống.

### 8.6. Chạy ESP32

1. Kết nối ESP32 với máy tính.
2. Mở mã nguồn ESP32 bằng công cụ lập trình tương ứng.
3. Kiểm tra cấu hình Wi-Fi.
4. Cập nhật địa chỉ MQTT Broker.
5. Kiểm tra chân kết nối DHT11 và SHT30.
6. Nạp chương trình vào ESP32.
7. Cấp nguồn cho ESP32.
8. Kiểm tra dữ liệu được gửi lên MQTT Broker.

Sau khi nạp chương trình, ESP32 có thể hoạt động bằng nguồn USB 5V độc lập, không cần duy trì kết nối USB với máy tính.

Tuy nhiên, máy chạy MQTT Broker và Backend vẫn cần hoạt động để tiếp nhận, xử lý và cung cấp dữ liệu cho hệ thống.

## 9. HƯỚNG DẪN GIẢNG VIÊN KIỂM TRA

### Kiểm tra 1: Thu thập dữ liệu cảm biến

- Khởi động MQTT Broker và Backend.
- Cấp nguồn ESP32.
- Mở Dashboard React.
- Quan sát dữ liệu nhiệt độ và độ ẩm được cập nhật.

Kết quả mong đợi:

Hệ thống nhận và hiển thị dữ liệu từ DHT11 và SHT30.

### Kiểm tra 2: Quản lý cảm biến và vùng kho

- Đăng nhập tài khoản có quyền ADMIN.
- Truy cập trang quản lý cảm biến hoặc vùng kho.
- Thực hiện các thao tác quản lý được giao diện hỗ trợ.
- Kiểm tra kết quả hiển thị và dữ liệu lưu trữ.

Kết quả mong đợi:

Các thao tác hợp lệ được xử lý và cập nhật dữ liệu.

Lưu ý: Không xóa các cảm biến vật lý đang được ánh xạ với MQTT trong quá trình kiểm tra.

### Kiểm tra 3: Lịch sử dữ liệu

- Truy cập trang lịch sử.
- Lọc dữ liệu theo cảm biến, vùng kho hoặc thời gian.
- Kiểm tra các bản ghi hiển thị.

Kết quả mong đợi:

Dữ liệu được hiển thị theo các điều kiện lọc.

Lưu ý: API lịch sử hiện trả về tối đa 100 bản ghi gần nhất. Các bộ lọc trên giao diện hoạt động trên tập dữ liệu được API trả về.

### Kiểm tra 4: Cảnh báo vượt ngưỡng

- Cấu hình ngưỡng nhiệt độ hoặc độ ẩm phù hợp để kiểm thử.
- Cho hệ thống tiếp nhận dữ liệu vượt ngưỡng.
- Truy cập trang cảnh báo.

Kết quả mong đợi:

Hệ thống ghi nhận cảnh báo khi dữ liệu vượt ngưỡng cấu hình.

### Kiểm tra 5: Cảnh báo mất kết nối

- Ngắt nguồn ESP32.
- Chờ vượt quá thời gian kiểm tra mất kết nối.
- Quan sát trạng thái cảm biến và cảnh báo.
- Cấp nguồn ESP32 trở lại.

Kết quả mong đợi:

Hệ thống phát hiện mất kết nối và tiếp tục nhận dữ liệu sau khi ESP32 kết nối lại.

### Kiểm tra 6: So sánh cảm biến

- Truy cập trang so sánh cảm biến.
- Chọn DHT11 và SHT30.
- Quan sát nhiệt độ, độ ẩm và mức chênh lệch.

Kết quả mong đợi:

Hệ thống hiển thị dữ liệu so sánh và hỗ trợ phát hiện chênh lệch bất thường.

## 10. CẤU TRÚC THƯ MỤC PROJECT

```text
IOT04-QuanLyKho/
|
|-- IOT04_API/
|   |-- Controllers/
|   |-- Models/
|   |-- Services/
|   |-- Program.cs
|   |-- ...
|
|-- IOT04_Frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- types/
|   |-- package.json
|   |-- ...
|
|-- ESP32/
|   |-- sketch_nov12a.ino
|
|-- Database/
|   |-- IOT04.sql
|
|-- Docs/
|   |-- UML/
|   |-- Images/
|
|-- README.md
|-- .gitignore
```

Cấu trúc thực tế của repository có thể được điều chỉnh theo cách tổ chức mã nguồn của project.

## 11. LƯU Ý KHI KIỂM TRA PROJECT

- Cần cấu hình SQL Server và MQTT Broker theo môi trường chạy thực tế.
- ESP32 và máy chạy MQTT Broker cần có kết nối mạng phù hợp.
- Không sử dụng trực tiếp địa chỉ IP thử nghiệm nếu mạng đã thay đổi.
- Không đưa mật khẩu Wi-Fi, mật khẩu cơ sở dữ liệu, API key hoặc token thật lên GitHub.
- Các tài khoản thử nghiệm cần được tạo hoặc cấu hình theo hướng dẫn triển khai.
- Các hình ảnh, sơ đồ và tài nguyên minh họa được lưu trong thư mục tài liệu của repository.

## 12. KẾT LUẬN

Đồ án IOT-04 đã xây dựng được hệ thống theo dõi điều kiện môi trường kho sử dụng ESP32, DHT11, SHT30, MQTT, ASP.NET Core, SQL Server và React.

Hệ thống thực hiện thu thập dữ liệu từ cảm biến thực tế, lưu trữ dữ liệu, hiển thị thông tin môi trường, quản lý cảm biến và phát hiện các trường hợp bất thường.

Thông qua đồ án, sinh viên vận dụng kiến thức phân tích và thiết kế hệ thống hướng đối tượng, xây dựng cơ sở dữ liệu, phát triển Web API, giao diện Web và tích hợp phần cứng IoT vào một hệ thống hoàn chỉnh.
