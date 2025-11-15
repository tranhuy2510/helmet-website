// Middleware xác thực đăng nhập
function isAuthenticated(req, res, next) {
  if (req.session.User && req.session.User.logIn) {
    return next();
  }
  res.redirect("/users/dang-nhap");
}

// Middleware xác thực admin
function isAdmin(req, res, next) {
  if (
    req.session.User &&
    req.session.User.logIn &&
    req.session.User.role === "admin"
  ) {
    return next();
  }
  res.status(403).send("Bạn không có quyền truy cập trang này");
}

// Middleware xác thực customer
function isCustomer(req, res, next) {
  if (
    req.session.User &&
    req.session.User.logIn &&
    req.session.User.role === "customer"
  ) {
    return next();
  }
  res.status(403).send("Bạn không có quyền truy cập trang này");
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isCustomer,
};
