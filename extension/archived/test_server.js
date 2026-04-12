// test_server.js — Chạy: node test_server.js
// Tạo 2 trang test: phishing và hợp lệ
const http = require('http');
const url  = require('url');

const phishingHTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>PayPal - Verify Account</title></head>
<body style="font-family:Arial;padding:40px;max-width:500px;margin:0 auto">
  <img src="https://www.paypal.com/favicon.ico" width="32">
  <h2>PayPal Account Verification</h2>
  <p>Your account has been limited. Please verify your identity.</p>
  <form>
    <input type="text"     placeholder="Email"    style="display:block;width:100%;padding:8px;margin:8px 0"><br>
    <input type="password" placeholder="Password" style="display:block;width:100%;padding:8px;margin:8px 0"><br>
    <button style="background:#003087;color:#fff;padding:10px 24px;border:none;cursor:pointer">
      Verify Now
    </button>
  </form>
</body></html>`;

const safeHTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Trang bình thường</title></head>
<body style="font-family:Arial;padding:40px">
  <h2>Đây là trang web bình thường</h2>
  <p>Extension nên hiển thị AN TOÀN cho trang này.</p>
</body></html>`;

http.createServer((req, res) => {
  const path = url.parse(req.url).pathname;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  if (path.includes('secure') || path.includes('verify') || path.includes('login')) {
    res.end(phishingHTML);
  } else {
    res.end(safeHTML);
  }
}).listen(3000, () => {
  console.log('Test server chay tai:');
  console.log('  [PHISHING] http://localhost:3000/secure-paypal/account/login/verify/password');
  console.log('  [AN TOAN]  http://localhost:3000/normal-page');
  console.log('\nCtrl+C de dung server.');
});
