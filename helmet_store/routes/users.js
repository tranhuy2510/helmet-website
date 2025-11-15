// E:\NNKichBan_CuoiKy\helmet_store\routes\users.js
var express = require("express");
var router = express.Router();
var db = require("../models/database");
var modelUser = require("../models/model_user");
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
router.get("/tai-khoan", function (req, res, next) {
  if (req.session.User) {
    res.render("site/my-account.ejs", { user: req.session.User });
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

module.exports = router;
