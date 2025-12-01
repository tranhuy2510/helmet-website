// E:\NNKichBan_CuoiKy\helmet_store\routes\users.js
var express = require("express");
var router = express.Router();
var db = require("../models/database");
var modelUser = require("../models/model_user");
var modelUserAddress = require("../models/model_user_address");
var modelOrder = require("../models/model_order");
const bcrypt = require("bcrypt");

// VALIDATION
// =======================
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;
  if (!email || typeof email !== "string") return "Email không được bỏ trống";
  if (!re.test(email.trim())) return "Email không hợp lệ";
  return null;
}

function validateUsername(username) {
  const re = /^[a-zA-Z0-9_]{3,20}$/;
  if (!username || typeof username !== "string")
    return "Username không được bỏ trống";
  if (!re.test(username.trim()))
    return "Username phải từ 3–20 ký tự và chỉ chứa chữ, số, dấu gạch dưới";
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== "string")
    return "Password không được bỏ trống";
  if (password.trim().length < 6) return "Password phải tối thiểu 6 ký tự";
  return null;
}

/* GET users listing. */
router.get("/tai-khoan", async function (req, res, next) {
  if (req.session.User) {
    try {
      console.log("=== TAI-KHOAN PAGE LOAD ===");
      console.log("Session User:", req.session.User);
      console.log("User ID for addresses:", req.session.User.id);

      // Lấy danh sách địa chỉ của user
      const addresses = await modelUserAddress.getAllAddresses(
        req.session.User.id
      );
      console.log("Addresses found:", addresses);

      // Lấy danh sách đơn hàng của user
      const orders = await modelOrder.getUserOrders(req.session.User.id);
      console.log("Orders found:", orders.length);

      res.render("site/my-account.ejs", {
        user: req.session.User,
        addresses: addresses,
        orders: orders,
        message: req.query.message || null,
      });
    } catch (err) {
      console.error("Error loading addresses:", err);
      res.render("site/my-account.ejs", {
        user: req.session.User,
        addresses: [],
        message: "Có lỗi xảy ra khi tải địa chỉ",
      });
    }
  } else {
    req.session.back = "/users/tai-khoan";
    res.redirect("/users/dang-nhap");
  }
});
router.get("/dang-nhap", function (req, res, next) {
  res.render("site/dang-nhap.ejs");
});
router.post("/dang-nhap", function (req, res, next) {
  let u = req.body.username;
  let p = req.body.password;
  if (!u || !p) {
    return res.render("site/dang-nhap", {
      message: "Vui lòng nhập đầy đủ thông tin",
    });
  }
  let sql = `SELECT * FROM user WHERE username = '${u}' OR email = '${u}'`;
  db.query(sql, (err, rows) => {
    if (rows.length <= 0) {
      res.render("site/dang-nhap", { message: "Sai tài khoản hoặc mật khẩu" });
      return;
    }
    let user = rows[0];
    let pass_fromdb = user.password;
    console.log(pass_fromdb);
    var kq = bcrypt.compareSync(p, pass_fromdb);
    console.log(kq);
    if (kq) {
      req.session.User = {
        id: user.idUser,
        username: user.username,
        ho: user.ho,
        ten: user.ten,
        phone: user.phone,
        email: user.email,
        role: user.role,
        address: user.address,
        logIn: true,
      };
      console.log("OK");

      // Phân quyền dựa trên role
      if (user.role === "admin") {
        res.redirect("/admin");
      } else if (req.session.back) {
        console.log(req.session.back);
        res.redirect(req.session.back);
      } else {
        res.redirect("/");
      }
    } else {
      console.log("Not OK");
      res.render("site/dang-nhap", { message: "Sai tài khoản hoặc mật khẩu" });
    }
  });
});
router.get("/dang-ky", function (req, res, next) {
  res.render("site/dang-ky.ejs");
});
router.post("/luu", async function (req, res, next) {
  let ho = req.body.ho;
  let ten = req.body.ten;
  let u = req.body.username;
  let em = req.body.email;
  let phone = req.body.phone;
  let p = req.body.password;
  let rp = req.body.retypePassword;
  let address = req.body.address;

  // VALIDATION
  // ============================
  let msg;

  if ((msg = validateUsername(u))) {
    return res.render("site/dang-ky", { message: msg });
  }
  if ((msg = validateEmail(em))) {
    return res.render("site/dang-ky", { message: msg });
  }
  if ((msg = validatePassword(p))) {
    return res.render("site/dang-ky", { message: msg });
  }
  if (p !== rp) {
    return res.render("site/dang-ky", {
      message: "Mật khẩu nhập lại không khớp",
    });
  }
  // Kiểm tra trùng Email
  let checkEmail = await modelUser.checkEmail(em);
  if (checkEmail) {
    return res.render("site/dang-ky", { message: "Email đã tồn tại" });
  }
  // Kiểm tra trùng Username
  let checkUser = await modelUser.checkUsername(u);
  if (checkUser) {
    return res.render("site/dang-ky", { message: "Username đã tồn tại" });
  }

  if (p === rp && p != "") {
    var salt = bcrypt.genSaltSync(10);
    var pass_mahoa = bcrypt.hashSync(p, salt);

    let user_info = {
      ho: ho,
      ten: ten,
      email: em,
      username: u,
      password: pass_mahoa,
      role: "customer",
      phone: phone,
      address: address,
    };

    let sql = "INSERT INTO user SET ?";
    db.query(sql, user_info);
  } else {
    res.redirect("/users/dang-ky");
  }

  res.redirect("/users/thanh-cong");
});
router.get("/thanh-cong", function (req, res, next) {
  let message = "Đăng ký thành công";
  res.render("site/thanh-cong", { message: message });
});
router.get("/dang-xuat", function (req, res, next) {
  req.session.destroy();
  res.redirect("/users/dang-nhap");
});
router.post("/doi-mat-khau", function (req, res, next) {
  let password = req.body.password;
  let newPassword = req.body.newPassword;
  let confirmPassword = req.body.confirmPassword;
  let u = req.session.User.username;
  console.log(u);

  // VALIDATE
  if (!password || !newPassword || !confirmPassword) {
    return res.render("site/thanh-cong", { message: "Dữ liệu không hợp lệ" });
  }

  if (newPassword !== confirmPassword) {
    return res.render("site/thanh-cong", {
      message: "Mật khẩu nhập lại không đúng",
    });
  }

  let sql = "SELECT * FROM user WHERE username = ?";
  db.query(sql, [u], (err, rows) => {
    if (rows.length <= 0) {
      res.redirect("/users/error");
      return;
    }
    let user = rows[0];
    let pass_fromdb = user.password;
    var kq = bcrypt.compareSync(password, pass_fromdb);
    if (kq) {
      var salt = bcrypt.genSaltSync(10);
      var pass_mahoa = bcrypt.hashSync(newPassword, salt);

      let sql2 = `UPDATE user SET password='${pass_mahoa}' WHERE username LIKE '%${u}%'`;
      db.query(sql2, (err, result) => {
        let mess = "Đổi mật khẩu thành công";
        res.render("site/thanh-cong", { message: mess });
      });
    } else {
      res.render("site/thanh-cong", { message: "Mật khẩu cũ không đúng" });
    }
  });
});

// Route để cập nhật thông tin tài khoản
router.post("/update", function (req, res, next) {
  if (!req.session.User) {
    return res.redirect("/users/dang-nhap");
  }

  let ho = req.body.ho;
  let ten = req.body.ten;
  let email = req.body.email;
  let address = req.body.address;
  let userId = req.session.User.id;

  // VALIDATION
  let msg;
  if ((msg = validateEmail(email))) {
    return res.render("site/my-account", {
      user: req.session.User,
      message: msg,
    });
  }

  if (!ho || !ten) {
    return res.render("site/my-account", {
      user: req.session.User,
      message: "Vui lòng nhập đầy đủ họ và tên",
    });
  }

  let sql = `UPDATE user SET ho = ?, ten = ?, email = ?, address = ? WHERE idUser = ?`;
  db.query(sql, [ho, ten, email, address, userId], function (err, result) {
    if (err) {
      console.log(err);
      return res.render("site/my-account", {
        user: req.session.User,
        message: "Có lỗi xảy ra khi cập nhật thông tin",
      });
    }

    // Cập nhật session
    req.session.User.ho = ho;
    req.session.User.ten = ten;
    req.session.User.email = email;
    req.session.User.address = address;

    res.render("site/my-account", {
      user: req.session.User,
      message: "Cập nhật thông tin thành công!",
    });
  });
});

// Route để cập nhật địa chỉ nhận hàng (thêm mới)
router.post("/update-address", async function (req, res, next) {
  console.log("=== POST UPDATE-ADDRESS (CREATE NEW) ===");
  console.log("Request body:", req.body);
  console.log("Session User:", req.session.User);

  if (!req.session.User) {
    return res.redirect("/users/dang-nhap");
  }

  let fullName = req.body.fullName;
  let phone = req.body.phone;
  let province = req.body.province;
  let district = req.body.district;
  let ward = req.body.ward;
  let detailAddress = req.body.detailAddress;
  let addressType = req.body.addressType || "home";
  let setAsDefault = req.body.setAsDefault === "1";
  let userId = req.session.User.id;

  // Validation
  console.log("Validation check:", {
    fullName: !!fullName,
    phone: !!phone,
    province: !!province,
    district: !!district,
    ward: !!ward,
    detailAddress: !!detailAddress,
  });

  if (
    !fullName ||
    !phone ||
    !province ||
    !district ||
    !ward ||
    !detailAddress
  ) {
    console.log("VALIDATION FAILED - Missing fields:", {
      fullName: !fullName ? "MISSING" : "OK",
      phone: !phone ? "MISSING" : "OK",
      province: !province ? "MISSING" : "OK",
      district: !district ? "MISSING" : "OK",
      ward: !ward ? "MISSING" : "OK",
      detailAddress: !detailAddress ? "MISSING" : "OK",
    });
    try {
      const addresses = await modelUserAddress.getAllAddresses(userId);
      return res.render("site/my-account", {
        user: req.session.User,
        addresses: addresses,
        message: "Vui lòng điền đầy đủ thông tin địa chỉ",
      });
    } catch (err) {
      console.log(err);
      return res.render("site/my-account", {
        user: req.session.User,
        addresses: [],
        message: "Vui lòng điền đầy đủ thông tin địa chỉ",
      });
    }
  }

  // Validate phone number
  const phoneRegex = /^[0-9]{10,11}$/;
  if (!phoneRegex.test(phone)) {
    try {
      const addresses = await modelUserAddress.getAllAddresses(userId);
      return res.render("site/my-account", {
        user: req.session.User,
        addresses: addresses,
        message: "Số điện thoại không hợp lệ",
      });
    } catch (err) {
      console.log(err);
      return res.render("site/my-account", {
        user: req.session.User,
        addresses: [],
        message: "Số điện thoại không hợp lệ",
      });
    }
  }

  try {
    console.log("Creating address with data:", {
      idUser: userId,
      fullName,
      phone,
      province,
      district,
      ward,
      detailAddress,
      addressType,
      isDefault: setAsDefault,
    });

    // Create address data
    const addressData = {
      idUser: userId,
      fullName,
      phone,
      province,
      district,
      ward,
      detailAddress,
      addressType,
      isDefault: setAsDefault,
    };

    // Create new address using model
    const result = await modelUserAddress.createAddress(addressData);
    console.log("Create address result:", result);

    // Cập nhật session user với địa chỉ mặc định mới
    if (setAsDefault) {
      req.session.User.phone = phone;
      let fullAddress = `${detailAddress}, ${ward}, ${district}, ${province}`;
      req.session.User.address = fullAddress;
    }

    // Redirect để tránh resubmission
    res.redirect(
      "/users/tai-khoan?message=" +
        encodeURIComponent("Thêm địa chỉ thành công!")
    );
  } catch (err) {
    console.error("ERROR in POST update-address:", err);
    console.error("Error stack:", err.stack);
    try {
      const addresses = await modelUserAddress.getAllAddresses(userId);
      res.render("site/my-account", {
        user: req.session.User,
        addresses: addresses,
        message: "Có lỗi xảy ra khi cập nhật địa chỉ",
      });
    } catch (err2) {
      console.log(err2);
      res.render("site/my-account", {
        user: req.session.User,
        addresses: [],
        message: "Có lỗi xảy ra khi cập nhật địa chỉ",
      });
    }
  }
});

// Route PUT để cập nhật địa chỉ hiện có (edit existing address)
router.put("/update-address", async function (req, res, next) {
  console.log("=== PUT UPDATE-ADDRESS (EDIT EXISTING) ===");
  console.log("Request body:", req.body);
  console.log("Session User:", req.session.User);

  if (!req.session.User) {
    return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
  }

  const { id, fullName, phone, province, district, ward, detailAddress } =
    req.body;
  const userId = req.session.User.id;

  console.log("Update params:", {
    id,
    userId,
    fullName,
    phone,
    province,
    district,
    ward,
    detailAddress,
  });

  // Validation
  if (
    !id ||
    !fullName ||
    !phone ||
    !province ||
    !district ||
    !ward ||
    !detailAddress
  ) {
    console.log("ERROR: Missing required fields");
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
  }

  // Validate phone number
  const phoneRegex = /^[0-9]{10,11}$/;
  if (!phoneRegex.test(phone)) {
    console.log("ERROR: Invalid phone number:", phone);
    return res
      .status(400)
      .json({ success: false, message: "Số điện thoại không hợp lệ" });
  }

  try {
    const addressData = {
      fullName,
      phone,
      province,
      district,
      ward,
      detailAddress: detailAddress,
      addressType: "home",
    };

    console.log("Updating address with data:", addressData);

    const result = await modelUserAddress.updateAddress(id, addressData);
    console.log("Update result:", result);

    res.json({ success: true, message: "Cập nhật địa chỉ thành công" });
  } catch (err) {
    console.error("ERROR updating address:", err);
    console.error("Error stack:", err.stack);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server: " + err.message });
  }
});

// Route debug để kiểm tra và tạo bảng user_addresses
router.get("/debug/check-table", async function (req, res) {
  try {
    // Kiểm tra xem bảng có tồn tại không
    const checkQuery = `
      SELECT COUNT(*) as table_exists 
      FROM information_schema.tables 
      WHERE table_schema = 'helmet_store' 
      AND table_name = 'user_addresses'
    `;

    const result = await db.query(checkQuery);
    console.log("Table check result:", result);

    if (result[0].table_exists === 0) {
      console.log("Table does not exist, creating...");

      // Tạo bảng nếu chưa tồn tại
      const createQuery = `
        CREATE TABLE IF NOT EXISTS user_addresses (
          idAddress int(11) NOT NULL AUTO_INCREMENT,
          idUser int(11) NOT NULL,
          fullName varchar(100) NOT NULL,
          phone varchar(15) NOT NULL,
          province varchar(50) NOT NULL,
          district varchar(50) NOT NULL,
          ward varchar(50) NOT NULL,
          detailAddress text NOT NULL,
          addressType enum('home','office','other') DEFAULT 'home',
          isDefault tinyint(1) DEFAULT 0,
          createdAt timestamp NOT NULL DEFAULT current_timestamp(),
          updatedAt timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (idAddress),
          KEY idUser (idUser),
          CONSTRAINT user_addresses_ibfk_1 FOREIGN KEY (idUser) REFERENCES user (idUser) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `;

      await db.query(createQuery);
      console.log("Table created successfully");
      res.json({ success: true, message: "Table created successfully" });
    } else {
      console.log("Table exists");

      // Kiểm tra cấu trúc bảng
      const describeQuery = "DESCRIBE user_addresses";
      const structure = await db.query(describeQuery);
      console.log("Table structure:", structure);

      res.json({
        success: true,
        message: "Table exists",
        structure: structure,
      });
    }
  } catch (error) {
    console.error("Error checking/creating table:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug route để kiểm tra database
router.get("/debug/check-table", async function (req, res) {
  try {
    // Kiểm tra bảng có tồn tại không
    const checkTableQuery = `SHOW TABLES LIKE 'user_addresses'`;
    db.query(checkTableQuery, (err, results) => {
      if (err) {
        return res.json({ error: "Error checking table", details: err });
      }

      if (results.length === 0) {
        return res.json({ error: "Table user_addresses does not exist" });
      }

      // Kiểm tra cấu trúc bảng
      const describeQuery = `DESCRIBE user_addresses`;
      db.query(describeQuery, (err2, structure) => {
        if (err2) {
          return res.json({ error: "Error describing table", details: err2 });
        }

        // Đếm số record
        const countQuery = `SELECT COUNT(*) as count FROM user_addresses`;
        db.query(countQuery, (err3, countResult) => {
          if (err3) {
            return res.json({ error: "Error counting records", details: err3 });
          }

          res.json({
            success: true,
            tableExists: true,
            structure: structure,
            recordCount: countResult[0].count,
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Route để lấy địa chỉ mặc định cho trang thanh toán
router.get("/default-address/:userId", async function (req, res) {
  console.log("=== GET DEFAULT ADDRESS ===");
  let userId = req.params.userId;
  console.log("User ID:", userId);

  try {
    // Try to get default address first
    console.log("Trying to get default address from user_addresses table...");
    const defaultAddress = await modelUserAddress.getDefaultAddress(userId);
    console.log("Default address result:", defaultAddress);

    if (defaultAddress) {
      console.log("Found default address, returning:", defaultAddress);
      res.json({ success: true, address: defaultAddress });
    } else {
      console.log("No default address found, falling back to user table...");
      // Fallback to user table address
      let userSql = `SELECT ho, ten, phone, address FROM user WHERE idUser = ?`;
      db.query(userSql, [userId], function (err, userResults) {
        if (err) {
          console.error("SQL Error in user fallback:", err);
          return res.json({ success: false });
        }

        if (userResults.length === 0) {
          console.log("No user found with idUser:", userId);
          return res.json({ success: false });
        }

        let user = userResults[0];
        console.log("User fallback data:", user);
        res.json({
          success: true,
          address: {
            fullName: `${user.ho} ${user.ten}`,
            phone: user.phone || "",
            detailAddress: user.address || "",
          },
        });
      });
    }
  } catch (err) {
    console.error("Error getting default address:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Route để set địa chỉ mặc định
router.post("/set-default-address", async function (req, res, next) {
  if (!req.session.User) {
    return res.json({ success: false, message: "Chưa đăng nhập" });
  }

  let addressId = req.body.addressId;
  let userId = req.session.User.id;

  try {
    await modelUserAddress.setDefaultAddress(addressId, userId);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Có lỗi xảy ra" });
  }
});

// Route để xóa địa chỉ
router.post("/delete-address", async function (req, res) {
  if (!req.session.User) {
    return res.json({ success: false, message: "Chưa đăng nhập" });
  }

  let addressId = req.body.addressId;
  let userId = req.session.User.id;

  try {
    await modelUserAddress.deleteAddress(addressId, userId);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Có lỗi xảy ra" });
  }
});

router.get("/quen-mat-khau", (req, res) => {
  res.render("site/quen-mat-khau", { message: "" });
});
router.get("/quen-mat-khau", (req, res) => {
  res.render("site/quen-mat-khau", { message: "" });
});

router.post("/quen-mat-khau", async (req, res) => {
  let email = req.body.email;

  if (!email) {
    return res.render("site/quen-mat-khau", { message: "Mời bạn nhập email" });
  }

  if (validateEmail(email)) {
    return res.render("site/quen-mat-khau", { message: "Email không hợp lệ" });
  }

  let checkEmail = await modelUser.checkEmail(email);

  if (checkEmail) {
    let mess = `Mật khẩu đã được gửi qua email ${email} của bạn!`;
    let newPassword = Math.random().toString(36).substring(7);

    var salt = bcrypt.genSaltSync(10);
    var pass_mahoa = bcrypt.hashSync(newPassword, salt);
    let sql = `UPDATE user SET password='${pass_mahoa}' WHERE email='${email}' `;
    db.query(sql);

    var nodemailer = require("nodemailer");

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tranlinh25.10.2004@gmail.com",
        pass: "qrrk lvqc ekfg kwql",
      },
      tls: { rejectUnauthorized: false },
    });

    var mailOptions = {
      from: "tranlinh25.10.2004@gmail.com",
      to: `${email}`,
      subject: "Lấy lại mật khẩu",
      html: `Mật khẩu mới của bạn: <b>${newPassword}</b>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      res.render("site/thanh-cong", { message: mess });
    });
  } else {
    let mess = "Email không tồn tại!";
    res.render("site/quen-mat-khau", { message: mess });
  }
});

// GET /users/get-default-address - Lấy địa chỉ mặc định để thanh toán
router.get("/get-default-address", async function (req, res, next) {
  try {
    if (!req.session.User) {
      return res.json({ success: false, message: "Vui lòng đăng nhập" });
    }

    const addresses = await modelUserAddress.getAllAddresses(
      req.session.User.id
    );
    const defaultAddress = addresses.find((addr) => addr.isDefault);

    if (defaultAddress) {
      res.json({ success: true, address: defaultAddress });
    } else {
      res.json({ success: false, message: "Chưa có địa chỉ mặc định" });
    }
  } catch (error) {
    console.error("Get default address error:", error);
    res.json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
