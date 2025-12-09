const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');
const vnpayConfig = require('../config/vnpay.config');
const modelOrder = require('../models/model_order');
const modelCart = require('../models/model_cart');

// Helper function to sort object by key - ĐÚNG CHUẨN VNPAY
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(key);
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = obj[str[key]];
  }
  return sorted;
}

// Route tạo thanh toán VNPay
router.post('/create_payment_url', async function (req, res, next) {
  try {
    // Kiểm tra đăng nhập
    if (!req.session.User) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thanh toán'
      });
    }

    const {
      amount,
      orderDescription,
      bankCode,
      language,
      // Thông tin đơn hàng
      name,
      phone,
      address,
      note,
      cartItems
    } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền không hợp lệ'
      });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống'
      });
    }

    // Tạo đơn hàng trong database với trạng thái PENDING
    const shippingAddress = `${name}, ${phone}, ${address}${note ? ', Ghi chú: ' + note : ''}`;
    const orderData = {
      idUser: req.session.User.id,
      totalAmount: amount,
      shippingAddress: shippingAddress,
      paymentMethod: 'VNPAY',
      cartItems: cartItems.map(item => ({
        idProduct: item.idProduct,
        quantity: item.quantity,
        size: item.size || 'M',
        price: item.price
      }))
    };

    const orderResult = await modelOrder.createOrder(orderData);
    const orderId = orderResult.orderId;

    // Tạo các tham số cho VNPay
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss'); // Thêm expire date
    
    // Lấy IP address và convert IPv6 sang IPv4 nếu cần
    let ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    
    // Convert IPv6 localhost (::1) sang IPv4 (127.0.0.1)
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }
    // Nếu là IPv6, lấy phần IPv4 embedded
    if (ipAddr && ipAddr.includes('::ffff:')) {
      ipAddr = ipAddr.replace('::ffff:', '');
    }

    // Debug: Log config
    console.log('=== VNPay Config ===');
    console.log('TmnCode:', vnpayConfig.vnp_TmnCode);
    console.log('HashSecret:', vnpayConfig.vnp_HashSecret ? 'Exists (length: ' + vnpayConfig.vnp_HashSecret.length + ')' : 'Missing');
    console.log('URL:', vnpayConfig.vnp_Url);
    console.log('ReturnUrl:', vnpayConfig.vnp_ReturnUrl);
    console.log('IP Address (processed):', ipAddr);
    console.log('Amount:', amount, '-> VNPay Amount:', amount * 100);

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.1';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = language || 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId.toString(); // Chuyển sang string
    vnp_Params['vnp_OrderInfo'] = orderDescription || 'Thanh toan don hang ' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPay yêu cầu nhân 100 (đơn vị: xu)
    vnp_Params['vnp_ReturnUrl'] = vnpayConfig.vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate; // Thêm expire date (bắt buộc)
    
    if (bankCode) {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    // Debug: Log params trước khi sort
    console.log('=== Params before sort ===');
    console.log(JSON.stringify(vnp_Params, null, 2));

    // Sắp xếp các tham số
    vnp_Params = sortObject(vnp_Params);

    // Debug: Log params sau khi sort
    console.log('=== Params after sort ===');
    console.log(JSON.stringify(vnp_Params, null, 2));

    // Tạo chuỗi query string để sign - ĐÚNG CHUẨN VNPAY
    let signData = [];
    for (let key in vnp_Params) {
      if (vnp_Params.hasOwnProperty(key)) {
        signData.push(key + '=' + encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+'));
      }
    }
    const signDataString = signData.join('&');
    
    // Debug: Log sign data
    console.log('=== Sign Data ===');
    console.log(signDataString);
    
    // Tạo secure hash
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signDataString, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    // Debug: Log secure hash
    console.log('=== Secure Hash ===');
    console.log(signed);

    // Tạo URL thanh toán
    const vnpUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

    console.log('=== VNPay Payment URL ===');
    console.log(vnpUrl);
    console.log('Order ID:', orderId);

    res.json({
      success: true,
      paymentUrl: vnpUrl,
      orderId: orderId
    });

  } catch (error) {
    console.error('VNPay create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo thanh toán',
      error: error.message
    });
  }
});

// Route nhận callback từ VNPay
router.get('/return', async function (req, res, next) {
  try {
    let vnp_Params = req.query;

    const secureHash = vnp_Params['vnp_SecureHash'];

    // Xóa các tham số không cần thiết
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp lại các tham số
    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi query string để verify - ĐÚNG CHUẨN VNPAY
    let signData = [];
    for (let key in vnp_Params) {
      if (vnp_Params.hasOwnProperty(key)) {
        signData.push(key + '=' + encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+'));
      }
    }
    const signDataString = signData.join('&');
    
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signDataString, 'utf-8')).digest('hex');

    console.log('VNPay Return - Received Hash:', secureHash);
    console.log('VNPay Return - Calculated Hash:', signed);
    console.log('VNPay Return - Match:', secureHash === signed);

    // Kiểm tra chữ ký
    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];
      const amount = vnp_Params['vnp_Amount'] / 100; // Chia 100 để lấy số tiền thực
      const transactionNo = vnp_Params['vnp_TransactionNo'];
      const bankCode = vnp_Params['vnp_BankCode'];
      const payDate = vnp_Params['vnp_PayDate'];

      // Kiểm tra mã phản hồi
      if (responseCode === '00') {
        // Thanh toán thành công
        await modelOrder.updateOrderStatus(orderId, 'PAID', transactionNo);
        
        // Xóa giỏ hàng của user
        if (req.session.User) {
          try {
            await modelCart.clearCart(req.session.User.id);
          } catch (error) {
            console.error('Error clearing cart:', error);
          }
        }

        res.render('site/thanh-cong', {
          success: true,
          message: 'Thanh toán thành công!',
          orderId: orderId,
          amount: amount,
          transactionNo: transactionNo,
          bankCode: bankCode,
          payDate: payDate,
          user: req.session.User || null
        });
      } else {
        // Thanh toán thất bại
        await modelOrder.updateOrderStatus(orderId, 'FAILED');
        
        const errorMessages = {
          '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
          '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
          '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
          '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
          '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
          '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
          '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
          '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
          '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
          '75': 'Ngân hàng thanh toán đang bảo trì.',
          '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
          '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
        };

        const errorMessage = errorMessages[responseCode] || 'Giao dịch thất bại';

        res.render('site/thanh-cong', {
          success: false,
          message: errorMessage,
          orderId: orderId,
          responseCode: responseCode,
          user: req.session.User || null
        });
      }
    } else {
      res.render('site/thanh-cong', {
        success: false,
        message: 'Chữ ký không hợp lệ',
        user: req.session.User || null
      });
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    res.render('site/thanh-cong', {
      success: false,
      message: 'Có lỗi xảy ra khi xử lý thanh toán',
      error: error.message,
      user: req.session.User || null
    });
  }
});

// Route IPN (Instant Payment Notification) - Webhook từ VNPay
router.get('/ipn', async function (req, res, next) {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi query string để verify - ĐÚNG CHUẨN VNPAY
    let signData = [];
    for (let key in vnp_Params) {
      if (vnp_Params.hasOwnProperty(key)) {
        signData.push(key + '=' + encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+'));
      }
    }
    const signDataString = signData.join('&');
    
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signDataString, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const rspCode = vnp_Params['vnp_ResponseCode'];

      // Kiểm tra đơn hàng có tồn tại không
      const order = await modelOrder.getOrderById(orderId);

      if (order) {
        if (order.status === 'PENDING') {
          if (rspCode === '00') {
            // Cập nhật trạng thái thành công
            await modelOrder.updateOrderStatus(orderId, 'PAID', vnp_Params['vnp_TransactionNo']);
            res.status(200).json({ RspCode: '00', Message: 'Success' });
          } else {
            // Cập nhật trạng thái thất bại
            await modelOrder.updateOrderStatus(orderId, 'FAILED');
            res.status(200).json({ RspCode: '00', Message: 'Success' });
          }
        } else {
          res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }
      } else {
        res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }
    } else {
      res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('VNPay IPN error:', error);
    res.status(500).json({ RspCode: '99', Message: 'Unknown error' });
  }
});

module.exports = router;
