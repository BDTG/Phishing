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

  sectionHeading("2. Nghiên cứu đối sánh với các Open-source Extension (Tuần 9)"),
  bodyText("Tiến hành phân tích kiến trúc của các dự án mã nguồn mở phổ biến trên GitHub (như cprite/phishing-detection-ext, PhishShield) để so sánh và tìm ra các điểm hạn chế."),
  bulletPoint("Ưu điểm của Đồ án so với Mã nguồn mở:"),
  technicalBox("Độ trễ và Quyền riêng tư", "Các dự án Open-source thường dùng kiến trúc Client-Server (gửi URL lên backend Python/Flask để chạy TensorFlow). Đồ án của chúng ta chạy XGBoost 100% Offline trên trình duyệt qua file JSON (<500KB), đảm bảo tốc độ Real-time (<5ms) và không gửi dữ liệu người dùng ra ngoài."),
  bulletPoint("Những thiếu sót cần khắc phục (Gap Analysis):"),
  technicalBox("Crowdsourcing (Báo cáo cộng đồng)", "Hệ thống chưa có cơ chế cho phép người dùng ấn nút 'Report' để tự động cập nhật danh sách đen (Blacklist) dùng chung trên Cloud."),
  technicalBox("Computer Vision (Thị giác máy tính)", "Do rào cản về hiệu năng trình duyệt, hệ thống chưa thể phân tích ảnh chụp màn hình (Screenshot/Logo) để chống lại các trang giả mạo giao diện tinh vi mà không giả mạo URL."),

  sectionHeading("3. Khai phá dữ liệu: Phương pháp Gộp và Chuẩn hóa"),
  bodyText("Quá trình xử lý dữ liệu (Data Engineering) được thực hiện nghiêm ngặt qua 4 bước:"),
  bulletPoint("Thu thập & Gộp (Combine): Sử dụng script Python gọi API tải dữ liệu từ PhishTank (phishing) và Tranco (legit). Sử dụng thư viện Pandas với hàm pd.concat() để gộp và drop_duplicates() để loại bỏ các URL trùng lặp."),
  bulletPoint("Gán nhãn (Labeling): Dữ liệu từ PhishTank tự động gán nhãn 1, từ Tranco gán nhãn 0."),
  bulletPoint("Chuẩn hóa chuỗi: Tất cả URL được hạ chữ thường (lowercase), loại bỏ tiền tố 'www.', xóa dấu gạch chéo cuối (trailing slash) và các thẻ fragment (#)."),
  bulletPoint("Cân bằng & Scaling: Sử dụng kỹ thuật SMOTE để tự động sinh mẫu lừa đảo giả lập và Undersampling cắt bớt mẫu an toàn, đưa tỷ lệ về 1:1. Cuối cùng, áp dụng StandardScaler để đồng bộ thang đo giữa các đặc trưng số."),

  sectionHeading("4. Giải thích chuyên sâu về Đặc trưng Ngữ vựng (XAI)"),
  bodyText("Trong số 39 đặc trưng, hai thuật toán cốt lõi nhất được sử dụng là:"),
  bulletPoint("Độ nhiễu (Shannon Entropy):"),
  technicalBox("Bản chất Toán học", "Không dùng từ điển, máy tính sử dụng công thức Shannon Entropy: Tổng của [-P * log2(P)] để đo lường sự phân bố xác suất (P) của các ký tự. Nếu sự phân bố mất cân bằng (ngôn ngữ loài người), điểm sẽ thấp. Nếu phân bố đồng đều hoàn toàn (máy tính random), điểm sẽ cao."),
  bodyText("Ví dụ 1 (Dự đoán được 100%): URL 'aaaaa' có chữ 'a' xuất hiện 100% (P=1). Entropy = -1*log2(1) = 0. Máy tính hiểu chuỗi này có quy luật hoàn toàn.", { italics: true, color: "555555", size: 24 }),
  bodyText("Ví dụ 2 (Ngôn ngữ tự nhiên): URL 'google.com' có các nguyên âm (o, e) và phụ âm lặp lại không đều. Khi tính toán, Entropy thường ở mức trung bình (khoảng 2.5 đến 3.5).", { italics: true, color: "555555", size: 24 }),
  bodyText("Ví dụ 3 (Mã độc tự sinh - DGA): URL 'x8f9q2z' có các ký tự và chữ số bốc ngẫu nhiên, xác suất xuất hiện của mỗi chữ là ngang bằng nhau (Uniform Distribution). Sự phân bố ngẫu nhiên tuyệt đối này tạo ra điểm Entropy cực kỳ CAO (khoảng 3.8 đến > 4.0), là dấu hiệu rõ ràng nhất của lừa đảo.", { italics: true, color: "555555", size: 24 }),
  bulletPoint("Khoảng cách Levenshtein (Levenshtein Distance):"),
  technicalBox("Bản chất Toán học", "Đo lường số bước tối thiểu (thêm, bớt, sửa) để biến chuỗi này thành chuỗi kia. Thuật toán này chuyên dùng để bắt kỹ thuật Typosquatting (kẻ xấu cố tình viết sai chính tả tên thương hiệu, ví dụ biến 'paypal' thành 'paypa1' với khoảng cách = 1)."),

  sectionHeading("5. Kế hoạch tuần tới (Tuần 10)"),
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