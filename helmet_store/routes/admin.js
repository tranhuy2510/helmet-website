var express = require("express");
var router = express.Router();
var db = require("../models/database");
var { isAdmin } = require("../middleware/auth");
var ejs = require("ejs");
var path = require("path");
var multer = require("multer");
var fs = require("fs");

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../public/img");
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique với timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ được upload file ảnh!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
});

// Helper function để render admin views với layout
function renderWithLayout(res, viewPath, data = {}) {
  const layoutPath = path.join(__dirname, "../views/admin/layout.ejs");
  const contentPath = path.join(__dirname, "../views/", viewPath + ".ejs");

  ejs.renderFile(contentPath, data, (err, content) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    data.body = content;
    ejs.renderFile(layoutPath, data, (err, html) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.send(html);
    });
  });
}

// Áp dụng middleware isAdmin cho tất cả routes admin
router.use(isAdmin);

// Dashboard admin
router.get("/", function (req, res, next) {
  // Lấy thống kê tổng quan
  let stats = {};

  // Đếm tổng số sản phẩm
  db.query(
    "SELECT COUNT(*) as totalProducts FROM product",
    (err, productResult) => {
      if (err) throw err;
      stats.totalProducts = productResult[0].totalProducts;

      // Đếm tổng số người dùng
      db.query(
        'SELECT COUNT(*) as totalUsers FROM user WHERE role = "customer"',
        (err, userResult) => {
          if (err) throw err;
          stats.totalUsers = userResult[0].totalUsers;

          // Tính tổng số đơn hàng (không tính đơn hàng đã hủy)
          db.query(
            "SELECT COUNT(*) as totalOrders FROM orders WHERE status != 'cancelled'",
            (err, orderResult) => {
              if (err) throw err;
              stats.totalOrders = orderResult[0].totalOrders;

              // Tính tổng doanh thu (không tính đơn hàng đã hủy)
              db.query(
                "SELECT SUM(totalAmount) as totalRevenue FROM orders WHERE status != 'cancelled'",
                (err, revenueResult) => {
                  if (err) throw err;
                  stats.totalRevenue = revenueResult[0].totalRevenue || 0;

                  renderWithLayout(res, "admin/index", {
                    stats: stats,
                    user: req.session.User,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Quản lý sản phẩm
router.get("/products", function (req, res, next) {
  let sql =
    "SELECT p.*, c.nameCat FROM product p LEFT JOIN catalog c ON p.idCat = c.idCat";
  db.query(sql, (err, products) => {
    if (err) throw err;
    renderWithLayout(res, "admin/products", {
      products: products,
      user: req.session.User,
    });
  });
});

// Thêm sản phẩm mới
router.get("/products/add", function (req, res, next) {
  db.query("SELECT * FROM catalog", (err, categories) => {
    if (err) throw err;
    renderWithLayout(res, "admin/product-add", {
      categories: categories,
      user: req.session.User,
    });
  });
});

router.post(
  "/products/add",
  upload.single("imgProduct"),
  function (req, res, next) {
    let { nameProduct, priceProduct, desProduct, specification, idCat } = req.body;
    let imgProduct = req.file ? `img/${req.file.filename}` : null;

    let sql =
      "INSERT INTO product (nameProduct, priceProduct, desProduct, specification, idCat, imgProduct) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(
      sql,
      [nameProduct, priceProduct, desProduct, specification, idCat, imgProduct],
      (err, result) => {
        if (err) throw err;
        res.redirect("/admin/products?success=add");
      }
    );
  }
);

// Sửa sản phẩm
router.get("/products/edit/:id", function (req, res, next) {
  let productId = req.params.id;
  db.query(
    "SELECT * FROM product WHERE idProduct = ?",
    [productId],
    (err, product) => {
      if (err) throw err;
      db.query("SELECT * FROM catalog", (err, categories) => {
        if (err) throw err;
        renderWithLayout(res, "admin/product-edit", {
          product: product[0],
          categories: categories,
          user: req.session.User,
        });
      });
    }
  );
});

router.post(
  "/products/edit/:id",
  upload.single("imgProduct"),
  function (req, res, next) {
    let productId = req.params.id;
    let { nameProduct, priceProduct, desProduct, specification, idCat } = req.body;

    // Nếu có file mới được upload
    if (req.file) {
      let imgProduct = `img/${req.file.filename}`;
      let sql =
        "UPDATE product SET nameProduct = ?, priceProduct = ?, desProduct = ?, specification = ?, idCat = ?, imgProduct = ? WHERE idProduct = ?";
      db.query(
        sql,
        [nameProduct, priceProduct, desProduct, specification, idCat, imgProduct, productId],
        (err, result) => {
          if (err) throw err;
          res.redirect("/admin/products?success=edit");
        }
      );
    } else {
      // Không có file mới, chỉ update các field khác
      let sql =
        "UPDATE product SET nameProduct = ?, priceProduct = ?, desProduct = ?, specification = ?, idCat = ? WHERE idProduct = ?";
      db.query(
        sql,
        [nameProduct, priceProduct, desProduct, specification, idCat, productId],
        (err, result) => {
          if (err) throw err;
          res.redirect("/admin/products?success=edit");
        }
      );
    }
  }
);

// Xóa sản phẩm
router.post("/products/delete/:id", function (req, res, next) {
  let productId = req.params.id;
  db.query(
    "DELETE FROM product WHERE idProduct = ?",
    [productId],
    (err, result) => {
      if (err) throw err;
      res.redirect("/admin/products?success=delete");
    }
  );
});

// Quản lý đơn hàng
router.get("/orders", function (req, res, next) {
  let sql = `SELECT o.*, u.username, u.ho, u.ten 
               FROM orders o 
               LEFT JOIN user u ON o.idUser = u.idUser 
               ORDER BY o.createdAt DESC`;
  db.query(sql, (err, orders) => {
    if (err) throw err;

    // Lấy message từ session và xóa nó
    const message = req.session.message;
    delete req.session.message;

    renderWithLayout(res, "admin/orders", {
      orders: orders,
      user: req.session.User,
      message: message,
    });
  });
});

// Chi tiết đơn hàng
router.get("/orders/:id", async function (req, res, next) {
  try {
    const modelOrder = require("../models/model_order");
    const orderId = req.params.id;

    // Lấy chi tiết đơn hàng bằng model
    const order = await modelOrder.getOrderDetails(orderId);

    if (!order) {
      return res.status(404).render("error", {
        message: "Không tìm thấy đơn hàng",
        error: { status: 404, stack: "" },
      });
    }

    // Render template admin order-detail
    res.render("admin/order-detail", {
      order: order,
      user: req.session.User,
    });
  } catch (error) {
    console.error("Admin order detail error:", error);
    res.status(500).render("error", {
      message: "Lỗi khi tải chi tiết đơn hàng",
      error: { status: 500, stack: error.stack },
    });
  }
});

// Cập nhật trạng thái đơn hàng
router.post(
  "/orders/:id/update-status",
  isAdmin,
  async function (req, res, next) {
    try {
      const modelOrder = require("../models/model_order");
      const orderId = req.params.id;
      const { status } = req.body;

      console.log("=== UPDATE ORDER STATUS ===");
      console.log("Order ID:", orderId);
      console.log("New Status:", status);
      console.log("Request body:", req.body);

      // Lấy thông tin đơn hàng hiện tại để kiểm tra trạng thái
      const currentOrder = await modelOrder.getOrderDetails(orderId);
      if (!currentOrder) {
        req.session.message = {
          type: "error",
          text: "Không tìm thấy đơn hàng",
        };
        return res.redirect("/admin/orders");
      }

      // Định nghĩa thứ tự trạng thái (không được chuyển ngược)
      const statusOrder = [
        "pending",
        "confirmed",
        "preparing",
        "shipping",
        "delivered",
      ];
      const currentStatusIndex = statusOrder.indexOf(currentOrder.status);
      const newStatusIndex = statusOrder.indexOf(status);

      // Kiểm tra không cho phép chuyển ngược (trừ trường hợp hủy)
      if (status !== "cancelled" && currentOrder.status !== "cancelled") {
        if (newStatusIndex < currentStatusIndex) {
          req.session.message = {
            type: "error",
            text: `Không thể chuyển trạng thái từ "${getStatusText(
              currentOrder.status
            )}" về "${getStatusText(status)}"`,
          };
          return res.redirect("/admin/orders");
        }
      }

      // Không cho phép thay đổi nếu đã hủy hoặc đã giao
      if (currentOrder.status === "cancelled") {
        req.session.message = {
          type: "error",
          text: "Không thể thay đổi trạng thái đơn hàng đã hủy",
        };
        return res.redirect("/admin/orders");
      }

      if (currentOrder.status === "delivered" && status !== "delivered") {
        req.session.message = {
          type: "error",
          text: "Không thể thay đổi trạng thái đơn hàng đã giao",
        };
        return res.redirect("/admin/orders");
      }

      // Cập nhật trạng thái đơn hàng
      await modelOrder.updateOrderStatus(orderId, status);

      req.session.message = {
        type: "success",
        text: `Cập nhật trạng thái đơn hàng #${orderId} thành "${getStatusText(
          status
        )}" thành công!`,
      };
      res.redirect("/admin/orders");
    } catch (error) {
      console.error("Update order status error:", error);
      req.session.message = {
        type: "error",
        text:
          "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng: " + error.message,
      };
      res.redirect("/admin/orders");
    }
  }
);

// Helper function để lấy text hiển thị của trạng thái
function getStatusText(status) {
  const statusMap = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    preparing: "Đang chuẩn bị",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
}

// Quản lý người dùng
router.get("/users", function (req, res, next) {
  let sql = "SELECT * FROM user ORDER BY idUser DESC";
  db.query(sql, (err, users) => {
    if (err) throw err;
    renderWithLayout(res, "admin/users", {
      users: users,
      user: req.session.User,
    });
  });
});

// Quản lý danh mục
router.get("/categories", function (req, res, next) {
  let sql = "SELECT * FROM catalog ORDER BY idCat DESC";
  db.query(sql, (err, categories) => {
    if (err) throw err;
    renderWithLayout(res, "admin/categories", {
      categories: categories,
      user: req.session.User,
    });
  });
});

// Thêm danh mục mới
router.post("/categories/add", function (req, res, next) {
  let { category_name } = req.body;
  let sql = "INSERT INTO catalog (nameCat) VALUES (?)";
  db.query(sql, [category_name], (err, result) => {
    if (err) throw err;
    res.redirect("/admin/categories");
  });
});

// Sửa danh mục
router.post("/categories/edit/:id", function (req, res, next) {
  let categoryId = req.params.id;
  let { category_name } = req.body;
  let sql = "UPDATE catalog SET nameCat = ? WHERE idCat = ?";
  db.query(sql, [category_name, categoryId], (err, result) => {
    if (err) throw err;
    res.redirect("/admin/categories");
  });
});

// Xóa danh mục
router.post("/categories/delete/:id", function (req, res, next) {
  let categoryId = req.params.id;
  db.query(
    "DELETE FROM catalog WHERE idCat = ?",
    [categoryId],
    (err, result) => {
      if (err) throw err;
      res.redirect("/admin/categories");
    }
  );
});

// Đăng xuất
router.get("/logout", function (req, res, next) {
  req.session.destroy();
  res.redirect("/users/dang-nhap");
});

module.exports = router;
