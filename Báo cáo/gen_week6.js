const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = require('C:/Users/BDTG/AppData/Roaming/npm/node_modules/docx');
const fs = require('fs');

const TNR = "Times New Roman";
const BODY_SIZE = 26; // 13pt

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE, ...opts })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 360 },
    indent: { firstLine: 720 },
  });
}

function listItem(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "• ", font: TNR, size: BODY_SIZE, bold: true }),
      new TextRun({ text, font: TNR, size: BODY_SIZE }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60, line: 360 },
    indent: { left: 720, hanging: 360 },
  });
}

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN - TUẦN 6", font: TNR, size: 32, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Sinh viên thực hiện: Trần Duy Thái", font: TNR, size: 28, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "MSSV: 2387700060", font: TNR, size: 28, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      new Paragraph({
        children: [new TextRun({ text: "1. Công việc đã hoàn thành trong Tuần 6", font: TNR, size: 28, bold: true })],
        spacing: { before: 240, after: 120 },
      }),
      body("Tuần này tập trung vào việc tối ưu hóa độ chính xác, giảm thiểu tỉ lệ báo động giả (False Positive) và hoàn thiện hạ tầng kỹ thuật của Extension."),
      
      new Paragraph({ children: [new TextRun({ text: "a. Tối ưu hóa logic nhận diện và giảm báo động nhầm:", font: TNR, size: BODY_SIZE, bold: true, italics: true })] }),
      listItem("Xử lý thành công các trường hợp trang web hợp lệ bị AI đánh giá rủi ro cao (ví dụ: cs.rin.ru, kwindu.eu) bằng cách kết hợp danh sách trắng (Whitelist) thủ công."),
      listItem("Chuyển đổi cơ chế Layer 4 (TLD Rules): Thay vì chặn cứng các đuôi tên miền .xyz, .tk, hệ thống chuyển sang áp dụng 'Phạt nhẹ' (Soft Penalty) và để mô hình ML đưa ra quyết định cuối cùng dựa trên các đặc trưng khác."),

      new Paragraph({ children: [new TextRun({ text: "b. Nâng cấp kiến trúc phòng thủ (Layer 6 & Layer 7):", font: TNR, size: BODY_SIZE, bold: true, italics: true })] }),
      listItem("Triển khai Harmless Page Check (Layer 6): Thêm chức năng quét DOM để nhận diện các trang 'vô hại' (không có form nhập liệu, không có input). Nếu trang vô hại, hệ thống tự động giảm 70% điểm rủi ro từ AI, giúp người dùng không bị làm phiền trên các trang đọc truyện, xem ảnh."),
      listItem("Hoàn thiện Reputation Bonus (Layer 7): Sửa lỗi kết nối API RDAP và thiết lập cơ chế cộng điểm uy tín tự động cho tên miền lâu năm (>1 năm) hoặc các TLD có độ tin cậy cao (.vn, .edu, .eu, .ru)."),

      new Paragraph({ children: [new TextRun({ text: "c. Đồng bộ hóa và hoàn thiện giao diện:", font: TNR, size: BODY_SIZE, bold: true, italics: true })] }),
      listItem("Đồng bộ nhân dự đoán (Prediction Engine) giữa Popup và Banner cảnh báo, đảm bảo kết quả hiển thị nhất quán trên toàn hệ thống."),
      listItem("Hiện đại hóa giao diện trang Cài đặt (Options) và Popup theo phong cách tối giản, chuyên nghiệp hơn."),

      new Paragraph({
        children: [new TextRun({ text: "2. Kế hoạch tuần tới (Tuần 7)", font: TNR, size: 28, bold: true })],
        spacing: { before: 240, after: 120 },
      }),
      listItem("Hoàn thiện toàn bộ nội dung quyển báo cáo đồ án (file Word)."),
      listItem("Thực hiện kiểm thử cuối cùng trên tập dữ liệu phishing thực tế mới nhất để đánh giá độ bền vững của mô hình."),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:/Users/BDTG/Desktop/Đồ Án Cơ Sở/BÁO CÁO TIẾN ĐỘ TUẦN 6.docx", buffer);
  console.log("Đã tạo BÁO CÁO TIẾN ĐỘ TUẦN 6.docx thành công.");
});
