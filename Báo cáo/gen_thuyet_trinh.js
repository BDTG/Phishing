const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } = require('C:/Users/BDTG/AppData/Roaming/npm/node_modules/docx');
const fs = require('fs');

const TNR = "Times New Roman";
const DIAGRAM_PATH = "C:/Users/BDTG/Desktop/Đồ Án Cơ Sở/URL Safety Evaluation-2026-04-22-102453.png";
const TABLE_IMAGE_PATH = "C:/Users/BDTG/Documents/ShareX/Screenshots/2026-04/WINWORD_WLjLBVVEsf.png";

// ============================================================
// HELPER FUNCTIONS (BỐ CỤC THEO YÊU CẦU NGƯỜI DÙNG)
// ============================================================

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

function customText(runs) {
  return new Paragraph({
    children: runs.map(r => new TextRun({ text: r.text, font: TNR, size: 26, bold: r.bold, italics: r.italics, color: r.color })),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 360 },
  });
}

function bulletPoint(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "• ", font: TNR, size: 26, bold: true }),
      new TextRun({ text, font: TNR, size: 26 }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60, line: 360 },
    indent: { left: 360, hanging: 180 },
  });
}

function imagePlaceholder(text) {
  return new Paragraph({
    children: [new TextRun({ text: `📷 ${text}`, font: TNR, size: 26, bold: true, italics: true, color: "C00000" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 160 },
  });
}

// ============================================================
// DOCUMENT CONTENT
// ============================================================

const children = [
  mainTitle("Báo cáo tiến độ thực hiện đồ án"),
  mainTitle("Buổi trình bày 23/04"),
  new Paragraph({ spacing: { after: 240 } }),

  sectionHeading("1. Mục tiêu tổng quát và các mục tiêu cụ thể"),
  bodyText("Mục tiêu tổng quát: Xây dựng một hệ thống bảo vệ người dùng trước các cuộc tấn công lừa đảo (phishing) thông qua URL bằng cách kết hợp học máy và phân tích nội dung thời gian thực."),
  bulletPoint("Phát hiện URL lừa đảo với độ chính xác trên 99% bằng mô hình XGBoost."),
  bulletPoint("Triển khai dưới dạng Chrome Extension hoạt động hoàn toàn offline để bảo vệ quyền riêng tư."),
  bulletPoint("Xây dựng kiến trúc phòng thủ đa tầng để giảm thiểu tối đa tỉ lệ báo động giả (False Positive)."),

  sectionHeading("2. Phạm vi triển khai"),
  bodyText("Hệ thống triển khai dưới dạng tiện ích mở rộng (Extension) trên trình duyệt Google Chrome theo chuẩn Manifest V3. Phạm vi nghiên cứu tập trung vào phân tích ngữ vựng URL (39 đặc trưng) và phân tích cấu trúc DOM trang web. Việc triển khai trên trình duyệt giúp can thiệp và cảnh báo người dùng ngay tại thời điểm truy cập (Real-time)."),
  bodyText("Lý do lựa chọn phạm vi này:", { bold: true }),
  bulletPoint("Manifest V3 đảm bảo hiệu suất cao và bảo mật tốt hơn so với V2."),
  bulletPoint("Phân tích URL + DOM đủ nhẹ để chạy offline trên trình duyệt mà vẫn đảm bảo độ chính xác."),
  bulletPoint("Tiếp cận Real-time giúp chặn đứng tấn công ngay khi người dùng vừa truy cập."),

  sectionHeading("3. Đối tượng phục vụ và giá trị ứng dụng"),
  bodyText("Đối tượng:", { bold: true }),
  bulletPoint("Người dùng internet phổ thông, đặc biệt là nhóm người dùng không có kiến thức chuyên sâu về ATTT."),
  bodyText("Bối cảnh:", { bold: true }),
  bulletPoint("Sự bùng nổ của các trang web giả mạo ngân hàng, ví điện tử, và mạng xã hội."),
  bodyText("Giá trị ứng dụng:", { bold: true }),
  bulletPoint("Cảnh báo tức thì bằng trực quan (Banner/Icon/Popup), hoạt động nhẹ nhàng."),
  bulletPoint("Bảo vệ quyền riêng tư tuyệt đối nhờ hoạt động hoàn toàn offline."),

  sectionHeading("4. Mô hình thực nghiệm chính (Pipeline hệ thống)"),
  bodyText("Hệ thống được thiết kế theo kiến trúc phòng thủ 8 lớp (Defense in Depth), kết hợp giữa danh sách tin cậy, quy tắc chuyên gia và học máy."),
  
  // Chèn ảnh sơ đồ Mermaid
  new Paragraph({
    children: [
      new ImageRun({
        data: fs.readFileSync(DIAGRAM_PATH),
        transformation: { width: 350, height: 550 },
        type: "png",
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
  }),
  bodyText("Hình 1: Quy trình xử lý URL qua Pipeline 8 lớp phòng thủ", { italics: false, size: 26 }),
  new Paragraph({ alignment: AlignmentType.CENTER }),

  bodyText("Chi tiết kỹ thuật các lớp phòng thủ:", { bold: true }),
  bulletPoint("Lớp 0-2 (Lọc nhanh): Giải mã URL đa vòng, nhận diện IP nội bộ và tra cứu Whitelist (Tranco 30K) / Blacklist."),
  bulletPoint("Lớp 3-4 (Heuristic): Sử dụng thuật toán Levenshtein phát hiện Typosquatting và Soft Penalty cho TLD đáng ngờ (.xyz, .tk)."),
  customText([{ text: "TLD: ", bold: true }, { text: "viết tắt của top-level domain, là phần đuôi url. kẻ tấn công thường dùng tld giá rẻ (.xyz, .tk) để ẩn danh." }]),
  bulletPoint("Lớp 5 (Core Engine): Mô hình XGBoost phân tích 39 đặc trưng ngữ vựng để tính toán xác suất lừa đảo."),
  bulletPoint("Lớp 6-7 (Hậu xử lý): Phân tích DOM (Harmless Check) và tuổi domain (RDAP) để hiệu chỉnh điểm số AI."),

  sectionHeading("5. Các bước triển khai đã thực hiện"),
  
  bodyText("Bước 1: Thu thập dữ liệu (Chạy script 01_collect_data.py)", { bold: true }),
  bodyText("sử dụng thư viện requests để tải phishtank_raw.csv (url báo cáo) và tranco_raw.csv (url uy tín có rank). gộp thành combined_dataset.csv bằng pandas."),
  
  bodyText("Tăng cường dữ liệu (Data Augmentation)", { bold: true }),
  bodyText("chạy script 01a_augment_brand_data.py để trộn thương hiệu, keyword và tld rác. giúp model nhận diện các trang lừa đảo mới (zero-day) dựa trên quy luật cấu trúc."),

  bodyText("Chuẩn hóa Dataset (Quy trình 4 bước)", { bold: true }),
  bulletPoint("Làm sạch & Chuẩn hóa: Loại bỏ trùng lặp, hạ chữ thường, xóa fragment."),
  bulletPoint("Xử lý mất cân bằng: Dùng SMOTE (tạo mẫu giả) và Undersampling (cắt bớt mẫu thực) để đưa tỷ lệ về 1:1."),
  bodyText("smote giúp model thấy nhiều biến thể lừa đảo hơn, tránh học thuộc lòng. undersampling giúp tập dữ liệu gọn nhẹ, học nhanh hơn."),
  bulletPoint("Scaling: Đồng bộ thang đo đặc trưng bằng StandardScaler."),

  bodyText("Bước 2: Trích xuất đặc trưng (Chạy script 02_feature_extraction_v3.py)", { bold: true }),
  bodyText("biến url thành 39 con số đặc trưng. thay vì liệt kê chi tiết, các đặc trưng được chia thành 5 nhóm cốt lõi:"),
  bulletPoint("Nhóm 1: Cấu trúc cơ bản (độ dài, tỷ lệ chữ số, v.v.)"),
  bulletPoint("Nhóm 2: Tên miền (số lượng subdomain, ký tự đặc biệt)"),
  bulletPoint("Nhóm 3: Đường dẫn (độ sâu, tham số query)"),
  bulletPoint("Nhóm 4: Từ khóa nhạy cảm (login, secure)"),
  bulletPoint("Nhóm 5: Giả mạo thương hiệu (các dấu hiệu Typosquatting)"),
  bodyText("trong đó, có 2 đặc trưng đóng vai trò cốt lõi nhất để phát hiện lừa đảo:"),
  bulletPoint("Độ nhiễu Entropy: đo mức độ lộn xộn của chuỗi. URL bình thường có ý nghĩa (Entropy thấp), URL do mã độc tự sinh thường ngẫu nhiên (Entropy cao). ví dụ: vietcombank.com.vn/ngan-hang-so (thấp) so với login-update.b2x9z.xyz/token=%A3%F9%8B... (cao)."),
  bulletPoint("Khoảng cách Levenshtein: đo số bước tối thiểu để biến chuỗi này thành chuỗi kia. dùng để bắt các chiêu trò cố tình viết sai chính tả tên thương hiệu (Typosquatting), ví dụ từ paypal thành paypa1."),

  bodyText("Bước 3: Huấn luyện model (Chạy script 03_train_model_v4.py)", { bold: true }),
  bodyText("huấn luyện mô hình xgboost và tối ưu siêu tham số. xuất ra file xgboost_model_v4.json để triển khai nhẹ trên trình duyệt."),

  bodyText("Bước 4: Danh sách trắng (Chạy script 04_prepare_tranco_top30k.py)", { bold: true }),
  bodyText("nén 30.000 tên miền uy tín vào tranco_top30k.json giúp extension phản hồi tức thì mà không cần hỏi model."),

  bodyText("Bước 5: Phát triển Extension (Javascript)", { bold: true }),
  customText([{ text: "chi tiết kỹ thuật: ", bold: true }, { text: "xgboost_predictor.js thực hiện suy luận. content_analyzer.js check harmless page (giảm 70% rủi ro nếu trang không có form)." }]),

  imagePlaceholder("HÌNH ẢNH MINH CHỨNG: Ảnh giao diện Extension và trang cài đặt mới"),

  sectionHeading("6. Kết quả thực nghiệm hiện tại"),
  bodyText("Mô hình XGBoost đạt F1-Score 0.9952 trên tập kiểm thử.", { bold: true }),
  bodyText("F1-Score là trung bình điều hòa giữa Precision và Recall. Đây là chỉ số khắt khe buộc mô hình phải tối ưu cả việc bắt đúng và không bỏ lọt nghi phạm."),
  bodyText("Extension đã vượt qua bài kiểm thử 105 URL thực tế với tỷ lệ chính xác 100%, độ trễ < 5ms."),
  
  new Paragraph({
    children: [
      new ImageRun({
        data: fs.readFileSync(TABLE_IMAGE_PATH),
        transformation: { width: 550, height: 400 },
        type: "png",
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
  }),

  sectionHeading("7. Khó khăn đã gặp và cách xử lý"),
  bodyText("Khó khăn 1:", { bold: true }),
  bulletPoint("Báo động nhầm cao trên một số trang giải trí trung quốc do URL chứa ký tự nằm trong blacklist."),
  bulletPoint("Xử lý: Triển khai Layer 6 (Harmless Page Check) - Trang không có form/input thì giảm 70% rủi ro."),
  bodyText("Kể cả thương hiệu như google.com đôi khi cũng bị flag là mất an toàn."),
  bodyText("Khó khăn 2:", { bold: true }),
  bulletPoint("Lỗi kết nối RDAP khi check tuổi domain quốc tế."),
  bulletPoint("Xử lý: Sửa API RDAP, thêm Timeout 10s và Reputation Bonus (cộng điểm cho TLD .vn, .eu, .ru……..)."),

  sectionHeading("8. Phần đã hoàn thành và kế hoạch"),
  bodyText("Đã hoàn thành:", { bold: true }),
  bulletPoint("Nhân dự đoán ML (39 features), 8 lớp phòng thủ, Giao diện và Hệ thống báo cáo."),
  bodyText("Đang thực hiện:", { bold: true }),
  bulletPoint("Hoàn thiện bản thảo quyển báo cáo đồ án v10."),
  bodyText("Kế hoạch tiếp theo:", { bold: true }),
  bulletPoint("Chuẩn bị demo và sửa bài báo cáo"),

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
  fs.writeFileSync("C:/Users/BDTG/Desktop/Đồ Án Cơ Sở/BAO_CAO_TIEN_DO_PRES_2304.docx", buffer);
  console.log("Đã cập nhật BAO_CAO_TIEN_DO_PRES_2304.docx sao chép chính xác bố cục người dùng mong muốn.");
});
