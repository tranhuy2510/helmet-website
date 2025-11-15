// E:\NNKichBan_CuoiKy\helmet_store\routes\index.js
var express = require("express");
var modelIndex = require("../models/model_index");
var modelUser = require("../models/model_user");
var modelProduct = require("../models/model_product");
var modelCart = require("../models/model_cart");
var router = express.Router();

/* GET home page. */
router.get("/", async function (req, res, next) {
  let listCat = await modelIndex.listCat();
  let listRecent = await modelIndex.listRecent();
  let listNewArrival = await modelIndex.listNewArrival();
  res.render("site/index", {
    listCat: listCat,
    listNewArrival: listNewArrival,
    listRecent: listRecent,
  });
});
// Cart route moved to /cart route file
router.get("/thanh-toan", async function (req, res, next) {
  try {
    let cartItems = [];
    let cartTotal = 0;
    let cartCount = 0;

    if (req.session.User) {
      // Logged in user
      cartItems = await modelCart.getCartItems(req.session.User.id);
      cartTotal = await modelCart.getCartTotal(req.session.User.id);
      cartCount = await modelCart.getCartCount(req.session.User.id);
    } else {
      // Redirect to login if not logged in
      req.session.back = "/thanh-toan";
      return res.redirect("/users/dang-nhap");
    }

    res.render("site/thanh-toan.ejs", {
      cartItems: cartItems,
      cartTotal: cartTotal,
      cartCount: cartCount,
      user: req.session.User || null,
    });
  } catch (error) {
    console.error("Checkout page error:", error);
    res
      .status(500)
      .render("error", { message: "Lỗi khi tải trang thanh toán" });
  }
});
// Wishlist route moved to /wishlist route file
router.get("/lien-he", function (req, res, next) {
  res.render("site/lien-he.ejs");
});

module.exports = router;
