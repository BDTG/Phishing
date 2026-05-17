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
  mainTitle("BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN - TUẦN 10"),
  new Paragraph({ spacing: { after: 240 } }),

  sectionHeading("1. Tình hình phát triển và Nâng cấp hệ thống chuyên sâu (Tuần 10)"),
  bodyText("Tuần 10 tập trung vào việc củng cố lớp phòng thủ nội dung (DOM Analysis), tối ưu hóa đặc trưng và tích hợp các tính năng minh bạch thông tin tương đương các công cụ bảo mật hàng đầu."),
  
  bodyText("a. Xây dựng Bộ máy rà soát đa luồng (Multi-threaded Live Phishing Scanner)", { bold: true }),
  bulletPoint("Thách thức: Để có dữ liệu huấn luyện 'tươi' và chính xác, cần rà soát hàng chục nghìn URL để tìm các trang web lừa đảo còn đang hoạt động (Live)."),
  bulletPoint("Giải pháp: Phát triển script Python đa luồng (50 threads) kết hợp Pool Executor."),
  technicalBox("Kết quả thực tế", "Hệ thống đã rà soát thành công 10.000 URL và phát hiện được 3.193 trang web lừa đảo đang sống, cung cấp nguồn Dataset cực kỳ giá trị cho mô hình AI."),

  bodyText("b. Nâng cấp Mô hình AI Content-based đạt độ chính xác 99.84%", { bold: true }),
  bulletPoint("Mở rộng đặc trưng: Nâng cấp từ 6 lên 8 đặc trưng HTML chuyên sâu, bổ sung Link Density (mật độ liên kết) và External Link Ratio (tỷ lệ link ngoại) lấy ý tưởng từ các nghiên cứu quốc tế trên GitHub."),
  technicalBox("Hiệu năng", "Mô hình XGBoost cho nội dung sau khi huấn luyện trên 3.193 mẫu sống đã đạt độ chính xác ấn tượng 99.84%, giúp phát hiện hiệu quả các trang giả mạo giao diện tinh vi."),

  bodyText("c. Tối ưu hóa đặc trưng qua bài thực nghiệm đối chuẩn (Benchmarking)", { bold: true }),
  bulletPoint("Thực hiện so sánh hiệu năng giữa bộ 39 đặc trưng URL và các bộ rút gọn (Top 20, 10, 5)."),
  technicalBox("Phát hiện", "Kết quả cho thấy chỉ với 10 đặc trưng quan trọng nhất (is_official_domain, url_entropy, typosquatting...), hệ thống vẫn giữ vững độ chính xác 99.6%. Điều này chứng minh hệ thống có khả năng tối ưu hóa rất cao cho các thiết bị di động hoặc môi trường tài nguyên thấp."),

  bodyText("d. Tích hợp Deep Analysis phong cách ChongLuaDao", { bold: true }),
  bulletPoint("Bổ sung khu vực 'Thông tin chi tiết (Live)' trên giao diện Popup."),
  bulletPoint("Tính năng: Hiển thị Địa chỉ IP, Vị trí máy chủ, Nhà cung cấp (ISP), WHOIS (Nhà đăng ký, ngày khởi tạo) và trạng thái SSL."),
  technicalBox("Tối ưu trải nghiệm", "Sử dụng cơ chế xử lý bất đồng bộ (Async Parallelism). Kết quả dự đoán AI luôn hiện ra trước (<1s), trong khi các thông tin chi tiết được tải song song bên dưới, giúp người dùng không cảm thấy trễ (lag)."),

  sectionHeading("2. Hoàn thiện và Đóng gói sản phẩm"),
  bulletPoint("Đã cập nhật toàn bộ các cải tiến mới nhất vào Extension (v10.5)."),
  bulletPoint("Tự động hóa quy trình huấn luyện và cập nhật mô hình từ script Python sang Extension JSON."),
  bulletPoint("Hoàn thành cập nhật Báo cáo đồ án cơ sở phiên bản v19, bổ sung các kết quả thực nghiệm tuần 10."),

  sectionHeading("3. Kế hoạch Tuần 11 (Chuẩn bị bảo vệ)"),
  bulletPoint("Hoàn thiện slide thuyết trình với các biểu đồ so sánh đặc trưng."),
  bulletPoint("Quay video demo thực tế khả năng phát hiện trang phishing Zero-day vừa tìm được."),
  bulletPoint("Kiểm tra lại toàn bộ hồ sơ và in ấn bản cuối cùng."),

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
  fs.writeFileSync("C:/Users/BDTG/Desktop/Đồ Án Cơ Sở/BÁO CÁO TIẾN ĐỘ TUẦN 10.docx", buffer);
  console.log("Đã tạo BÁO CÁO TIẾN ĐỘ TUẦN 10.docx thành công.");
});
