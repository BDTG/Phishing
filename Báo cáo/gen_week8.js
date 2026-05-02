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
    indent: { left: 720 },
    spacing: { before: 80, after: 80, line: 360 },
  });
}

const children = [
  mainTitle("BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN - TUẦN 8"),
  new Paragraph({ spacing: { after: 240 } }),

  sectionHeading("1. Tình hình phát triển và Tối ưu hóa hệ thống"),
  bodyText("Trong tuần 8, trọng tâm của đồ án là xử lý triệt để các phản hồi từ Giảng viên hướng dẫn và các vấn đề phát sinh trong quá trình thử nghiệm thực tế (Edge Cases). Mục tiêu cốt lõi là xóa bỏ sự phụ thuộc vào việc cấu hình thủ công (Manual Whitelisting) và thay thế bằng các thuật toán tự động, thông minh hơn."),

  bodyText("a. Xây dựng Thuật toán chấm điểm uy tín (Algorithmic Trust Scoring)", { bold: true }),
  bulletPoint("Vấn đề cũ: Mốc cộng điểm uy tín cứng nhắc (>365 ngày) khiến các startup công nghệ chân chính (dưới 1 năm tuổi) bị đánh giá sai lệch, dẫn đến việc phải dùng danh sách trắng (Whitelist) thủ công mang tính thiên vị."),
  bulletPoint("Giải pháp: Nâng cấp Lớp 7 (Domain Age Check) thành cơ chế Chấm điểm uy tín bậc thang (Gradient Reputation Bonus)."),
  technicalBox("Chi tiết kỹ thuật", "Hệ thống tự động phân loại và giảm trừ xác suất lừa đảo theo 3 cấp độ: Domain > 365 ngày (giảm 35% rủi ro), > 180 ngày (giảm 20%), và > 90 ngày (giảm 10%). Điều này đảm bảo sự công bằng và tính tự động hóa cao, giải quyết triệt để ca báo động nhầm của trang geminicli.com (315 ngày tuổi)."),

  bodyText("b. Tinh chỉnh thuật toán Phân tích Nội dung (DOM Analysis)", { bold: true }),
  bulletPoint("Vấn đề cũ: Tính năng cảnh báo 'Yêu cầu thẻ tín dụng' (Layer 6) bị báo động giả (False Positive) trên các trang công nghệ dạng SaaS vì chúng thường chứa từ khóa 'billing' ở cuối trang kèm theo một form tìm kiếm đơn giản."),
  bulletPoint("Giải pháp: Cải tiến hàm hasCreditCardRequest() để quét sâu hơn vào cấu trúc thẻ HTML."),
  technicalBox("Chi tiết kỹ thuật", "Thuật toán không chỉ tìm kiếm từ khóa nhạy cảm, mà bắt buộc trang web phải chứa các thẻ <form> có chứa trường nhập liệu đặc thù (như <input type='password'>, <input type='number'>, <input type='text'>). Việc này giúp triệt tiêu hoàn toàn báo động giả trên các trang thông tin hoặc trang có thanh tìm kiếm."),

  bodyText("c. Tích hợp tính năng Gỡ lỗi chuyên sâu (Explainable AI & Debug Mode)", { bold: true }),
  bulletPoint("Vấn đề: Mô hình học máy thường bị xem là 'Hộp đen' (Black box), khó giải thích được lý do đằng sau một quyết định phân loại."),
  bulletPoint("Giải pháp: Xây dựng cơ chế DEBUG_MODE ghi log chi tiết luồng thực thi qua 8 lớp, trích xuất trực quan ma trận 39 đặc trưng thô (Raw Features) và minh bạch hóa sự biến thiên của xác suất rủi ro."),
  technicalBox("Case Study thực tế", "Kiểm thử URL 'linkneverdie.net/all-software/?p=1'. Mô hình XGBoost (Lớp 5) đánh giá rủi ro lên tới 88.45% do cấu trúc URL phức tạp. Tuy nhiên, Lớp 7 (Domain Age) ghi nhận tên miền đã tồn tại 2682 ngày. Hệ thống lập tức kích hoạt Trust Scoring Tier 1 (giảm 35%), tự động kéo xác suất xuống còn 57.49% (Mức An toàn). Điều này chứng minh hệ thống có khả năng tự sửa sai cho thiên kiến (bias) của AI một cách hoàn toàn tự động."),

  sectionHeading("2. Kế hoạch tuần tới (Tuần 9)"),
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
  fs.writeFileSync("C:/Users/BDTG/Desktop/Đồ Án Cơ Sở/BÁO CÁO TIẾN ĐỘ TUẦN 8.docx", buffer);
  console.log("Đã tạo BÁO CÁO TIẾN ĐỘ TUẦN 8.docx thành công.");
});