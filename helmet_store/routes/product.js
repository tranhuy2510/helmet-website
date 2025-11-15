// E:\NNKichBan_CuoiKy\helmet_store\routes\product.js
var express = require("express");
var router = express.Router();
var modelProduct = require("../models/model_product"); //nhúng model products vào controller này để sử dụng
var modelCatalog = require("../models/model_catalog");

var breadcrumb = "Tất cả sản phẩm";

router.get("/", async function (req, res) {
  try {
    let listPro = await modelProduct.list(); //cách gọi hàm trong model, để có dữ liệu từ db
    let listProPopular = await modelProduct.list();
    let listCat = await modelCatalog.list();

    const search = (req.query.search || "").trim();
    const priceRange = req.query.priceRange || "";
    const sortOrder = req.query.sort || "";

    let breadcrumbParts = [];

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      listPro = listPro.filter((p) =>
        (p.nameProduct || "").toLowerCase().includes(s)
      );
      breadcrumbParts.push(`Tìm kiếm: ${search}`);
    }

    // Price range filter
    if (priceRange) {
      let priceText = "";
      switch (priceRange) {
        case "0-500000":
          listPro = listPro.filter(
            (p) => p.priceProduct >= 0 && p.priceProduct <= 500000
          );
          priceText = "0 ₫ - 500.000 ₫";
          break;
        case "500000-1000000":
          listPro = listPro.filter(
            (p) => p.priceProduct > 500000 && p.priceProduct <= 1000000
          );
          priceText = "500.000 ₫ - 1.000.000 ₫";
          break;
        case "1000000-2000000":
          listPro = listPro.filter(
            (p) => p.priceProduct > 1000000 && p.priceProduct <= 2000000
          );
          priceText = "1.000.000 ₫ - 2.000.000 ₫";
          break;
        case "2000000-5000000":
          listPro = listPro.filter(
            (p) => p.priceProduct > 2000000 && p.priceProduct <= 5000000
          );
          priceText = "2.000.000 ₫ - 5.000.000 ₫";
          break;
        case "5000000-up":
          listPro = listPro.filter((p) => p.priceProduct > 5000000);
          priceText = "Trên 5.000.000 ₫";
          break;
      }
      if (priceText) breadcrumbParts.push(priceText);
    }

    // Sort by price
    if (sortOrder === "asc") {
      listPro.sort((a, b) => a.priceProduct - b.priceProduct);
      breadcrumbParts.push("Giá tăng dần");
    } else if (sortOrder === "desc") {
      listPro.sort((a, b) => b.priceProduct - a.priceProduct);
      breadcrumbParts.push("Giá giảm dần");
    }

    // Build final breadcrumb
    const breadcrumb =
      breadcrumbParts.length > 0
        ? breadcrumbParts.join(" • ")
        : "Tất cả sản phẩm";

    res.render("site/san-pham", {
      listPro: listPro,
      listCat: listCat,
      listProPopular: listProPopular,
      breadcrumb,
      currentPriceRange: priceRange,
      currentSort: sortOrder,
    });
  } catch (err) {
    console.error("Product list error:", err);
    res
      .status(500)
      .render("error", { message: "Lỗi khi tải danh sách sản phẩm" });
  }
});
router.get("/addnew", function (req, res, next) {
  res.render("product_addnew"); // hiển thị form cho client nhập data
});
router.get("/:name", async function (req, res) {
  let name = req.params.name;
  let listPro = await modelProduct.list();
  let listCat = await modelCatalog.list();

  for (itemPro of listPro) {
    var newNamePro = itemPro.nameProduct;
    breadcrumb = newNamePro;
    newNamePro = replaceNameProduct(itemPro.nameProduct).toLowerCase();
    console.log(newNamePro);
    if (newNamePro == name) {
      var newItemPro = itemPro;
      break;
    }
  }
  if (!newItemPro) {
    // product not found -> show 404 friendly page
    return res
      .status(404)
      .render("error", { message: "Sản phẩm không tồn tại" });
  }

  let listComment = await modelProduct.getComment(newItemPro.idProduct);
  res.render("site/chi-tiet-san-pham", {
    itemPro: newItemPro,
    listCat: listCat,
    listPro: listPro,
    listComment: listComment,
    breadcrumb,
  });
});

// API
router.get("/api/hot-product", async function (req, res) {
  let data = await modelProduct.hotProduct();
  res.json(data);
});
router.get("/api/new-product", async function (req, res) {
  let data = await modelProduct.newProduct();
  res.json(data);
});
router.get("/api/chi-tiet-san-pham/:name", async function (req, res) {
  let name = req.params.name;
  console.log(name);
  let data = await modelProduct.detailByName(name);
  console.log(data);
  res.json(data);
});

router.get("/api/comment/:id", async function (req, res) {
  let idProduct = req.params.id;
  let data = await modelProduct.getComment(idProduct);
  res.json(data);
});
router.post("/comment/createcomment", async function (req, res) {
  let rating = req.body.star;
  let ten = req.body.ten;
  let email = req.body.email;
  let content = req.body.content;
  let idProduct = req.body.idProduct;
  let date = new Date();

  let data = {
    ten: ten,
    email: email,
    content: content,
    idProduct: idProduct,
    rating: rating,
    date: date,
  };

  console.log(data);
  let query = await modelProduct.createComment(data);
  let nameProduct = req.body.nameProduct;
  newName = replaceNameProduct(nameProduct).toLowerCase();
  res.redirect(`/san-pham/${newName}`);
});

function xoa_dau(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.split(" ").join("-");
  return str;
}

function replaceNameProduct(nameProduct) {
  var newNameProduct = xoa_dau(nameProduct);
  return newNameProduct;
}

module.exports = router;
