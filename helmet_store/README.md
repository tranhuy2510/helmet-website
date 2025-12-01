# Helmet Store (Website bán mũ bảo hiểm)

**Mô tả**
- Đây là một website thương mại điện tử mẫu (Node.js + Express + EJS) để quản lý sản phẩm, giỏ hàng, wishlist, đơn hàng và đánh giá sản phẩm.
- Dự án phù hợp làm demo, bài tập hoặc cơ sở để phát triển thêm tính năng thương mại điện tử.

**Tính năng chính**
- Danh sách sản phẩm, trang chi tiết sản phẩm
- Giỏ hàng (thêm/xóa/cập nhật số lượng)
- Wishlist (yêu thích) với toggle qua AJAX
- Hệ thống đánh giá sản phẩm (review) — chỉ cho phép người đã mua đánh giá
- Quản trị cơ bản (giao diện admin để thêm/sửa/xóa sản phẩm và quản lý đơn hàng)

**Cấu trúc chính của dự án**
- `app.js` — entrypoint của ứng dụng
- `routes/` — các route Express (index, product, cart, users, wishlist, admin...)
- `models/` — logic tương tác DB (product, cart, user, wishlist, review...)
- `views/` — các template EJS (site/ và admin/)
- `public/` — tài sản tĩnh: CSS, JS, images
- `bin/www` — file khởi động server (nếu sử dụng cấu trúc mặc định của Express)
- `helmet_store.sql` — file SQL dùng để import database mẫu

**Yêu cầu trước khi chạy**
- Node.js (14+ khuyến nghị)
- npm
- MySQL (hoặc MariaDB)

**Cách cài đặt (PowerShell trên Windows)**
```powershell
cd e:\NNKichBan_CuoiKy\helmet_store
npm install
# Tạo database và import schema
# Mở MySQL client / phpMyAdmin và import file `helmet_store.sql`
```

**Biến môi trường (ví dụ `.env`)**
- `DB_HOST` — host MySQL (mặc định `localhost`)
- `DB_USER` — user DB
- `DB_PASSWORD` — mật khẩu DB
- `DB_NAME` — tên database (ví dụ `helmet_store`)
- `SESSION_SECRET` — khóa session
- `PORT` — cổng (mặc định `3000`)

Lưu ý: Dự án hiện đọc cấu hình kết nối DB từ `models/database.js`. Kiểm tra/thiết lập biến môi trường hoặc chỉnh trực tiếp file này (không khuyến nghị cho production).

**Chạy ứng dụng**
```powershell
# Sau khi cài đặt và import DB
npm start
# Mở trình duyệt: http://localhost:3000
```

**Đường dẫn & chia sẻ chức năng quan trọng**
- Trang chủ: `/`
- Danh sách sản phẩm: `/san-pham`
- Trang chi tiết sản phẩm: (ví dụ) `/product/:id` hoặc theo routing hiện có trong `routes/product.js`
- Giỏ hàng: `/cart`
- Wishlist: `/wishlist`
- Người dùng: `/users/dang-nhap`, `/users/dang-ky`
- Admin: theo route `routes/admin.js` (kiểm tra middleware/auth để quyền truy cập)

**Ghi chú kỹ thuật**
- Frontend dùng EJS + Bootstrap + jQuery
- Tương tác wishlist, cart dùng AJAX (xem `public/js/main.js`)
- Review: kiểm tra xem người dùng đã mua sản phẩm trước khi cho phép gửi đánh giá (logic nằm trong `models/model_review.js` và `routes/product.js`)
- CSS tuỳ chỉnh nằm ở `public/css/style.css`

**Mẹo debug nhanh**
- Nếu không thể kết nối DB, kiểm tra `models/database.js` và biến môi trường
- Để reset DB dev, import lại `helmet_store.sql`
- Kiểm tra console/log Node để biết lỗi server

**License**
- Đây là dự án mẫu / demo.



