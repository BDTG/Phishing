const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('C:/Users/BDTG/AppData/Roaming/npm/node_modules/docx');
const fs = require('fs');

const TNR = "Times New Roman";

function mainTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), font: TNR, size: 32, bold: true, color: "000000" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240, line: 360 },
  });
}

function sectionHeading(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: TNR, size: 28, bold: true, color: "000000" })],
    spacing: { before: 240, after: 120, line: 360 },
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: TNR, size: 26, ...opts })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 360 },
  });
}

function bulletPoint(text, indentLevel = 0) {
  return new Paragraph({
    children: [
      new TextRun({ text: "• ", font: TNR, size: 26, bold: true }),
      new TextRun({ text, font: TNR, size: 26 }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60, line: 360 },
    indent: { left: 360 + indentLevel * 360, hanging: 180 },
  });
}

function technicalBox(title, content) {
  return new Paragraph({
    children: [
      new TextRun({ text: `→ ${title}: `, font: TNR, size: 26, bold: true, italics: true, color: "20208B" }),
      new TextRun({ text: content, font: TNR, size: 26, italics: true, color: "404040" }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 720 },
    spacing: { before: 80, after: 80, line: 360 },
  });
}

const children = [
  mainTitle("BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN - TUẦN 8 & 9"),
  new Paragraph({ spacing: { after: 240 } }),

  sectionHeading("1. Tình hình phát triển và Tối ưu hóa hệ thống (Cập nhật Tuần 8 & 9)"),
  bodyText("Hệ thống đã loại bỏ hoàn toàn sự phụ thuộc vào cấu hình thủ công (Manual Whitelisting) và nâng cấp danh sách đen thành tự động để đảm bảo tính công bằng và tính thực tiễn cao nhất."),
  
  bodyText("a. Nâng cấp Danh sách đen Động (Dynamic Blacklist) qua Phishing.army", { bold: true }),
  bulletPoint("Vấn đề cũ: Lớp 2 (Blacklist) chỉ dựa vào một file tĩnh dangerous_urls.json gồm hơn 100 URL, khiến hệ thống không thể bắt kịp các chiến dịch lừa đảo mới phát sinh hàng giờ."),
  bulletPoint("Giải pháp: Tích hợp nguồn dữ liệu thời gian thực từ Phishing.army - dự án mã nguồn mở chuyên tổng hợp danh sách đen từ các tổ chức bảo mật lớn trên thế giới (Cert.pl, Urlscan.io)."),
  technicalBox("Chi tiết kỹ thuật", "Background Service Worker của Extension sẽ tự động fetch danh sách hàng ngàn domain lừa đảo mới nhất từ Phishing.army và lưu vào bộ nhớ tạm chrome.storage.local. Để tối ưu tốc độ và băng thông, danh sách này được cache (lưu trữ) trong 6 giờ. Lớp 2 giờ đây sẽ gộp cả danh sách tĩnh và danh sách động trên bộ nhớ RAM, giúp hệ thống luôn cập nhật mà vẫn giữ được tốc độ tra cứu chớp nhoáng O(1)."),

  bodyText("b. Xây dựng Thuật toán chấm điểm uy tín (Algorithmic Trust Scoring)", { bold: true }),
  technicalBox("Chi tiết", "Nâng cấp Lớp 7 (Domain Age Check) thành cơ chế Chấm điểm uy tín bậc thang: Domain > 365 ngày (giảm 35%), > 180 ngày (giảm 20%), > 90 ngày (giảm 10%)."),
  bodyText("b. Tinh chỉnh thuật toán Phân tích Nội dung (DOM Analysis)", { bold: true }),
  technicalBox("Chi tiết", "Cải tiến hàm quét thẻ tín dụng, yêu cầu bắt buộc trang web phải chứa thẻ <form> và <input> nhạy cảm, giúp triệt tiêu báo động giả trên các trang SaaS có chữ 'billing'."),
  bodyText("c. Tích hợp tính năng Gỡ lỗi chuyên sâu (Explainable AI & Debug Mode)", { bold: true }),
  technicalBox("Chi tiết", "Xây dựng cơ chế DEBUG_MODE ghi log chi tiết luồng thực thi 8 lớp, trích xuất ma trận 39 đặc trưng thô, chứng minh hệ thống có khả năng tự sửa sai thiên kiến (bias) của AI hoàn toàn tự động."),

  bodyText("d. Tích hợp Nhận diện Mã độc chủ động (Proactive Malware Dropper Detection)", { bold: true }),
  bulletPoint("Vấn đề: Thuật toán Harmless Page trước đây chỉ kiểm tra form mật khẩu. Nếu trang lừa đảo phát tán mã độc (Malware Dropper) yêu cầu tải file .exe hoặc .apk, trang web sẽ bị đánh giá nhầm là vô hại và bị giảm rủi ro."),
  technicalBox("Chi tiết", "Cải tiến Lớp 6 (DOM Analysis) để quét toàn bộ các thẻ liên kết (HREF). Nếu phát hiện URL trỏ trực tiếp đến các tệp thực thi nguy hiểm (.exe, .apk, .bat, .msi, .cmd, .dmg), hệ thống lập tức tước bỏ quyền 'Trang vô hại' và cộng thêm 0.5 điểm rủi ro, kết hợp với điểm ML để chặn đứng trang web."),

  bodyText("e. Khắc phục Lỗ hổng Ký sinh Đám mây (Cloud Hosting Abuse)", { bold: true }),
  bulletPoint("Vấn đề: Kẻ tấn công lợi dụng các nền tảng đám mây miễn phí (Azure, Firebase, Github Pages) để host trang phishing. Do tên miền gốc (ví dụ windows.net) có tuổi đời hàng chục năm, Lớp 7 (Domain Age) đã bị đánh lừa và áp dụng giảm trừ rủi ro (Reputation Bonus) cực lớn, gây ra lỗi bỏ lọt (False Negative)."),
  technicalBox("Case Study thực tế", "Phát hiện trang lừa đảo 'arubawebmailsession82.blob.core.windows.net' được AI chấm rủi ro cao, nhưng bị Lớp 7 hạ xuống mức An toàn vì nhận diện nhầm tuổi domain là 11227 ngày (tuổi của Microsoft). Hệ thống đã được vá lỗi bằng cách lập danh sách đen các nền tảng 'Shared Hosting'. Mọi URL nằm trên các nền tảng này sẽ bị từ chối đặc quyền tra cứu tuổi domain, buộc phải chịu mức đánh giá rủi ro nguyên bản từ AI."),

  sectionHeading("2. Nghiên cứu đối sánh với các Open-source Extension (Tuần 9)"),
  bodyText("Tiến hành phân tích kiến trúc của các dự án mã nguồn mở phổ biến trên GitHub (như cprite/phishing-detection-ext, PhishShield) để so sánh và tìm ra các điểm hạn chế."),
  bulletPoint("Ưu điểm của Đồ án so với Mã nguồn mở:"),
  technicalBox("Độ trễ và Quyền riêng tư", "Các dự án Open-source thường dùng kiến trúc Client-Server (gửi URL lên backend Python/Flask để chạy TensorFlow). Đồ án của chúng ta chạy XGBoost 100% Offline trên trình duyệt qua file JSON (<500KB), đảm bảo tốc độ Real-time (<5ms) và không gửi dữ liệu người dùng ra ngoài."),
  bulletPoint("Những thiếu sót cần khắc phục (Gap Analysis):"),
  technicalBox("Crowdsourcing (Báo cáo cộng đồng)", "Hệ thống chưa có cơ chế cho phép người dùng ấn nút 'Report' để tự động cập nhật danh sách đen (Blacklist) dùng chung trên Cloud."),
  technicalBox("Computer Vision (Thị giác máy tính)", "Do rào cản về hiệu năng trình duyệt, hệ thống chưa thể phân tích ảnh chụp màn hình (Screenshot/Logo) để chống lại các trang giả mạo giao diện tinh vi mà không giả mạo URL."),

  sectionHeading("3. Nghiên cứu cơ sở lý thuyết và tham chiếu quốc tế (Cập nhật)"),
  bodyText("Trong tuần này, em đã tiến hành nghiên cứu sâu bài báo khoa học 'Using Lexical Features for Malicious URL Detection' và tài liệu về 'Chiến lược Phân tích Đặc trưng Nội dung Web và Tối ưu hóa Mô hình XGBoost'."),
  
  bodyText("a. Cơ sở toán học và Sự vượt trội của XGBoost", { bold: true }),
  bodyText("Nghiên cứu chỉ ra rằng XGBoost vượt trội hơn các mạng nơ-ron học sâu (Deep Learning) trong triển khai thực tế nhờ cơ chế điều hòa (Regularization)."),
  technicalBox("Công thức tối ưu", "L(phi) = sum[l(y_pred, y)] + sum[Omega(f)]. Trong đó Omega giúp kiểm soát độ phức tạp của cây qua tham số Gamma (số lá) và Lambda (trọng số lá), ngăn chặn hiện tượng học vẹt (overfitting) - một lỗi cực kỳ phổ biến trong phát hiện phishing."),
  technicalBox("Hiệu năng thực tế", "Thực nghiệm chứng minh XGBoost huấn luyện nhanh gấp 12.6 lần và tiết kiệm bộ nhớ 3.6 lần so với CNN/LSTM, trong khi độ chính xác cao hơn ~2.1%. Điều này củng cố quyết định lựa chọn XGBoost để chạy Offline trên trình duyệt của đồ án."),

  bodyText("b. Hệ thống đặc trưng nội dung chuyên sâu (Content-based)", { bold: true }),
  bodyText("Tài liệu cung cấp danh mục các đặc trưng 'tang chứng' mạnh nhất mà em đã tích hợp vào Mô hình AI số 2:"),
  bulletPoint("Server Form Handler (SFH): Kiểm tra thuộc tính action của form. Nếu trỏ đến domain lạ hoặc mailto:, rủi ro phishing là cực cao."),
  bulletPoint("IFrame Redirection: Phát hiện các khung nhúng vô hình (frameBorder='0') dùng để tải trang độc hại ngầm."),
  bulletPoint("External Links Ratio: Tỷ lệ liên kết ngoại bộ cao bất thường so với nội dung chính thống."),

  sectionHeading("4. Kế hoạch tuần tới (Tuần 10)"),
  bulletPoint("Đóng gói mã nguồn Extension hoàn chỉnh để nộp lên hệ thống nhà trường."),
  bulletPoint("In ấn quyển báo cáo đồ án (bản cứng)."),
  bulletPoint("Tổng duyệt (Rehearsal) kịch bản bảo vệ trước hội đồng."),

  new Paragraph({
    children: [new TextRun({ text: "Sinh viên thực hiện: Trần Duy Thái", font: TNR, size: 26, bold: true })],
    alignment: AlignmentType.RIGHT,
    spacing: { before: 400 },
  }),
];

const doc = new Document({
  sections: [{
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:/Users/BDTG/Desktop/Đồ Án Cơ Sở/BÁO CÁO TIẾN ĐỘ TUẦN 9.docx", buffer);
  console.log("Đã tạo BÁO CÁO TIẾN ĐỘ TUẦN 9.docx thành công.");
});