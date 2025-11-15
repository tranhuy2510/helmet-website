var express = require("express");
var router = express.Router();
var db = require("../models/database");
var { isAdmin } = require("../middleware/auth");
var ejs = require("ejs");
var path = require("path");

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

          // Đếm tổng số đơn hàng
          db.query(
            "SELECT COUNT(*) as totalOrders FROM orders",
            (err, orderResult) => {
              if (err) throw err;
              stats.totalOrders = orderResult[0].totalOrders;

              // Tính tổng doanh thu
              db.query(
                "SELECT SUM(totalAmount) as totalRevenue FROM orders",
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

router.post("/products/add", function (req, res, next) {
  let { nameProduct, priceProduct, desProduct, idCat, imgProduct } = req.body;
  let sql =
    "INSERT INTO product (nameProduct, priceProduct, desProduct, idCat, imgProduct) VALUES (?, ?, ?, ?, ?)";
  db.query(
    sql,
    [nameProduct, priceProduct, desProduct, idCat, imgProduct],
    (err, result) => {
      if (err) throw err;
      res.redirect("/admin/products");
    }
  );
});

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

router.post("/products/edit/:id", function (req, res, next) {
  let productId = req.params.id;
  let { nameProduct, priceProduct, desProduct, idCat, imgProduct } = req.body;
  let sql =
    "UPDATE product SET nameProduct = ?, priceProduct = ?, desProduct = ?, idCat = ?, imgProduct = ? WHERE idProduct = ?";
  db.query(
    sql,
    [nameProduct, priceProduct, desProduct, idCat, imgProduct, productId],
    (err, result) => {
      if (err) throw err;
      res.redirect("/admin/products");
    }
  );
});

// Xóa sản phẩm
router.post("/products/delete/:id", function (req, res, next) {
  let productId = req.params.id;
  db.query(
    "DELETE FROM product WHERE product_id = ?",
    [productId],
    (err, result) => {
      if (err) throw err;
      res.redirect("/admin/products");
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
    renderWithLayout(res, "admin/orders", {
      orders: orders,
      user: req.session.User,
    });
  });
});

// Chi tiết đơn hàng
router.get("/orders/:id", function (req, res, next) {
  let orderId = req.params.id;
  let sql = `SELECT o.*, u.username, u.ho, u.ten, u.phone, u.email, u.address
               FROM orders o 
               LEFT JOIN user u ON o.idUser = u.idUser 
               WHERE o.idOrder = ?`;

  db.query(sql, [orderId], (err, order) => {
    if (err) throw err;

    // Lấy chi tiết sản phẩm trong đơn hàng
    let detailSql = `SELECT oi.*, p.nameProduct, oi.price
                        FROM order_items oi
                        LEFT JOIN product p ON oi.idProduct = p.idProduct
                        WHERE oi.idOrder = ?`;

    db.query(detailSql, [orderId], (err, orderDetails) => {
      if (err) throw err;
      renderWithLayout(res, "admin/order-detail", {
        order: order[0],
        orderDetails: orderDetails,
        user: req.session.User,
      });
    });
  });
});

// Cập nhật trạng thái đơn hàng
router.post("/orders/update-status/:id", function (req, res, next) {
  let orderId = req.params.id;
  let { status } = req.body;
  let sql = "UPDATE orders SET status = ? WHERE idOrder = ?";
  db.query(sql, [status, orderId], (err, result) => {
    if (err) throw err;
    res.redirect("/admin/orders");
  });
});

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
