(function ($) {
  "use strict";

  // Dropdown on mouse hover
  $(document).ready(function () {
    function toggleNavbarMethod() {
      if ($(window).width() > 768) {
        $(".navbar .dropdown")
          .on("mouseover", function () {
            $(".dropdown-toggle", this).trigger("click");
          })
          .on("mouseout", function () {
            $(".dropdown-toggle", this).trigger("click").blur();
          });
      } else {
        $(".navbar .dropdown").off("mouseover").off("mouseout");
      }
    }
    toggleNavbarMethod();
    $(window).resize(toggleNavbarMethod);
  });

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Header slider
  $(".header-slider").slick({
    autoplay: true,
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
  });

  // Product Slider 4 Column
  $(".product-slider-4").slick({
    // autoplay: true,
    infinite: true,
    dots: false,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  });

  // Product Slider 3 Column
  $(".product-slider-3").slick({
    autoplay: true,
    infinite: true,
    dots: false,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  });

  // Product Detail Slider
  $(".product-slider-single").slick({
    infinite: true,
    autoplay: true,
    dots: false,
    fade: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    asNavFor: ".product-slider-single-nav",
  });
  $(".product-slider-single-nav").slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    dots: false,
    centerMode: true,
    focusOnSelect: true,
    asNavFor: ".product-slider-single",
  });

  // Brand Slider
  $(".brand-slider").slick({
    speed: 5000,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    slidesToShow: 5,
    slidesToScroll: 1,
    infinite: true,
    swipeToSlide: true,
    centerMode: true,
    focusOnSelect: false,
    arrows: false,
    dots: false,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 300,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  });

  // Review slider
  $(".review-slider").slick({
    autoplay: true,
    dots: false,
    infinite: true,
    slidesToShow: 2,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  });

  // Widget slider
  $(".sidebar-slider").slick({
    autoplay: true,
    dots: false,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
  });

  // Quantity
  $(".qty button").on("click", function () {
    var $button = $(this);
    var oldValue = $button.parent().find("input").val();
    if ($button.hasClass("btn-plus")) {
      var newVal = parseFloat(oldValue) + 1;
    } else {
      if (oldValue > 0) {
        var newVal = parseFloat(oldValue) - 1;
      } else {
        newVal = 0;
      }
    }
    $button.parent().find("input").val(newVal);
  });

  // Shipping address show hide
  $(".checkout #shipto").change(function () {
    if ($(this).is(":checked")) {
      $(".checkout .shipping-address").slideDown();
    } else {
      $(".checkout .shipping-address").slideUp();
    }
  });

  // Payment methods show hide
  $(".checkout .payment-method .custom-control-input").change(function () {
    if ($(this).prop("checked")) {
      var checkbox_id = $(this).attr("id");
      $(".checkout .payment-method .payment-content").slideUp();
      $("#" + checkbox_id + "-show").slideDown();
    }
  });
})(jQuery);

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

// Do not rewrite slug links on the client; server renders correct URLs

// Cart and Wishlist Functions
$(document).ready(function () {
  // Use event delegation so dynamically-inserted buttons work too
  $(document).on("click", ".add-to-cart", function (e) {
    e.preventDefault();
    var $btn = $(this);
    var productId = $btn.data("product-id");
    // Try to get quantity from nearest known containers, fallback to specific id or default 1
    var quantity = $btn
      .closest(".product-item, .product-content, tr")
      .find(".qty input")
      .val();
    if (!quantity) {
      var $qtyById = $("#qty-" + productId);
      if ($qtyById.length) {
        quantity = $qtyById.val();
      }
    }
    var size = $btn
      .closest(".product-content")
      .find(".size-btn.active")
      .data("size");
    // defaults if UI not present
    if (!quantity) quantity = 1;

    if (!productId) {
      showNotification("Không xác định được sản phẩm.", "error");
      return;
    }

    addToCart(productId, quantity, size);
  });

  $(document).on("click", ".add-to-wishlist", function (e) {
    e.preventDefault();
    var productId = $(this).data("product-id");
    var $btn = $(this);
    if (!productId) {
      showNotification("Không xác định được sản phẩm.", "error");
      return;
    }
    toggleWishlist(productId, $btn);
  });

  // Update cart quantity
  $(document).on("click", ".cart-quantity-update", function () {
    var cartId = $(this).data("cart-id");
    var quantity = $(this).closest(".qty").find("input").val();
    updateCartQuantity(cartId, quantity);
  });

  // Remove from cart
  $(document).on("click", ".remove-from-cart", function () {
    var cartId = $(this).data("cart-id");
    if (confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) {
      removeFromCart(cartId);
    }
  });

  // Update cart and wishlist counters on page load
  updateCartCounter();
  updateWishlistCounter();
});

// Add to Cart function
function addToCart(productId, quantity, size) {
  $.ajax({
    url: "/cart/add",
    method: "POST",
    data: {
      idProduct: productId,
      quantity: quantity,
      // only send size if chosen
      ...(size ? { size: size } : {}),
    },
    statusCode: {
      401: function () {
        showNotification(
          "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.",
          "error"
        );
        window.location.href = "/users/dang-nhap";
      },
    },
    success: function (response) {
      if (response.success) {
        showNotification(response.message, "success");
        updateCartCounter();
      } else {
        showNotification(response.message, "error");
      }
    },
    error: function () {
      showNotification("Lỗi khi thêm vào giỏ hàng", "error");
    },
  });
}

// Toggle Wishlist function
function toggleWishlist(productId, $btn) {
  $.ajax({
    url: "/wishlist/toggle",
    method: "POST",
    data: {
      idProduct: productId,
    },
    success: function (response) {
      if (response.success) {
        showNotification(response.message, "success");
        updateWishlistCounter();

        // Update button appearance
        if (response.inWishlist) {
          $btn.addClass("active").html('<i class="fa fa-heart"></i>');
        } else {
          $btn.removeClass("active").html('<i class="fa fa-heart-o"></i>');
        }
      } else {
        showNotification(response.message, "error");
      }
    },
    error: function () {
      showNotification("Lỗi khi cập nhật danh sách yêu thích", "error");
    },
  });
}

// Update Cart Quantity function
function updateCartQuantity(cartId, quantity) {
  $.ajax({
    url: "/cart/update",
    method: "POST",
    data: {
      idCart: cartId,
      quantity: quantity,
    },
    success: function (response) {
      if (response.success) {
        updateCartCounter();
        location.reload(); // Reload to update totals
      } else {
        showNotification(response.message, "error");
      }
    },
    error: function () {
      showNotification("Lỗi khi cập nhật giỏ hàng", "error");
    },
  });
}

// Remove from Cart function
function removeFromCart(cartId) {
  $.ajax({
    url: "/cart/remove",
    method: "POST",
    data: {
      idCart: cartId,
    },
    success: function (response) {
      if (response.success) {
        showNotification(response.message, "success");
        updateCartCounter();
        location.reload(); // Reload to update page
      } else {
        showNotification(response.message, "error");
      }
    },
    error: function () {
      showNotification("Lỗi khi xóa sản phẩm", "error");
    },
  });
}

// Update Cart Counter
function updateCartCounter() {
  $.ajax({
    url: "/cart/count",
    method: "GET",
    success: function (response) {
      $(".cart .btn span").text("(" + response.cartCount + ")");
    },
  });
}

// Update Wishlist Counter
function updateWishlistCounter() {
  $.ajax({
    url: "/wishlist/count",
    method: "GET",
    success: function (response) {
      $(".wishlist .btn span").text("(" + response.wishlistCount + ")");
    },
  });
}

// Show Notification
function showNotification(message, type) {
  var alertClass = type === "success" ? "alert-success" : "alert-danger";
  var notification = $(
    '<div class="alert ' +
      alertClass +
      ' alert-dismissible fade show notification" role="alert">' +
      message +
      '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
      '<span aria-hidden="true">&times;</span>' +
      "</button>" +
      "</div>"
  );

  $("body").prepend(notification);

  // Auto remove after 3 seconds
  setTimeout(function () {
    notification.fadeOut();
  }, 3000);
}

// Search functionality
$(".search button").on("click", function () {
  var searchTerm = $(".search input").val();
  if (searchTerm.trim()) {
    window.location.href = "/san-pham?search=" + encodeURIComponent(searchTerm);
  }
});

$(".search input").on("keypress", function (e) {
  if (e.which === 13) {
    // Enter key
    var searchTerm = $(this).val();
    if (searchTerm.trim()) {
      window.location.href =
        "/san-pham?search=" + encodeURIComponent(searchTerm);
    }
  }
});
