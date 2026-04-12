const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, PageNumber, Footer, Header,
  BorderStyle, TabStopType, TabStopPosition,
  LineRuleType, SectionType,
  Table, TableRow, TableCell, WidthType,
  Bookmark, InternalHyperlink, TableOfContents
} = require('C:/Users/BDTG/AppData/Roaming/npm/node_modules/docx');
const fs = require('fs');

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const TNR = "Times New Roman";
const BODY_SIZE = 26;       // 13pt
const HEADING_CH = 32;      // 16pt bold (chương)
const HEADING_MUC = 28;     // 14pt bold (mục 1.x)
const HEADING_TIEU = 28;    // 14pt italic (tiểu mục 1.x.x)
const HEADING_CON = 26;     // 13pt underline (1.x.x.x)
const LINE_SPACING = 360;   // 1.5 lines

function makeSpacing(before = 0, after = 120) {
  return { before, after, line: LINE_SPACING, lineRule: LineRuleType.AUTO };
}

// Đoạn văn thường (có firstLine indent 1.27cm)
function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE, ...opts })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: makeSpacing(0, 120),
    indent: { firstLine: 720 },
  });
}

// Đoạn văn nhất quán với body (dùng cho mục đánh số riêng dòng)
function bodyNoIndent(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE, ...opts })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: makeSpacing(0, 120),
    indent: { firstLine: 720 },
  });
}

// Mục danh sách đánh số (hanging indent để số thẳng lề)
function listItem(number, text, opts = {}) {
  return new Paragraph({
    children: [
      new TextRun({ text: number + " ", font: TNR, size: BODY_SIZE, bold: true }),
      new TextRun({ text, font: TNR, size: BODY_SIZE, ...opts }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: makeSpacing(0, 80),
    indent: { left: 720, hanging: 360 },
  });
}

// Công thức toán học (căn giữa, in nghiêng)
function formula(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE, italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(80, 80),
  });
}

// Tiêu đề chương: Heading 1 — Word sẽ nhận diện cho TOC tự động
function chapterHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: text.toUpperCase(), font: TNR, size: HEADING_CH, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(240, 120),
    pageBreakBefore: true,
  });
}

// Tiêu đề mục 1.x: Heading 2
function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: TNR, size: HEADING_MUC, bold: true })],
    alignment: AlignmentType.LEFT,
    spacing: makeSpacing(180, 60),
  });
}

// Tiêu đề tiểu mục 1.x.x: Heading 3
function subHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: TNR, size: HEADING_TIEU, italics: true })],
    alignment: AlignmentType.LEFT,
    spacing: makeSpacing(120, 60),
    indent: { left: 360 },
  });
}

// Tiêu đề mục con 1.x.x.x: không có heading level (không hiện trong TOC)
function subSubHeading(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: TNR, size: HEADING_CON, underline: {} })],
    alignment: AlignmentType.LEFT,
    spacing: makeSpacing(100, 40),
    indent: { left: 720 },
  });
}

function emptyLine() {
  return new Paragraph({ children: [new TextRun("")], spacing: makeSpacing(0, 0) });
}

// Tạo bookmark ID từ text — dùng chung cho heading và TOC
function makeId(text) {
  const m = text.match(/(\d+(?:\.\d+)*)/);
  if (m) return 'sec-' + m[1].replace(/\./g, '-');
  // Cho các mục đặc biệt (LỜI CẢM ƠN, TÀI LIỆU...)
  return 'sec-' + text.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30).toLowerCase();
}

// Mục lục entry — chương (bold, không thụt)
function tocChapter(text, id) {
  const anchor = id || makeId(text);
  return new Paragraph({
    children: [
      new InternalHyperlink({
        anchor,
        children: [new TextRun({ text, font: TNR, size: BODY_SIZE, bold: true })],
      }),
      new TextRun({ text: '\t', font: TNR, size: BODY_SIZE }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: 9240, leader: 'dot' }],
    spacing: makeSpacing(60, 40),
  });
}
// Mục lục entry — mục 1.x (thụt 360)
function tocSection(text, id) {
  const anchor = id || makeId(text);
  return new Paragraph({
    children: [
      new InternalHyperlink({
        anchor,
        children: [new TextRun({ text, font: TNR, size: BODY_SIZE })],
      }),
      new TextRun({ text: '\t', font: TNR, size: BODY_SIZE }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: 9240, leader: 'dot' }],
    indent: { left: 360 },
    spacing: makeSpacing(30, 30),
  });
}
// Mục lục entry — tiểu mục 1.x.x (thụt 720)
function tocSub(text, id) {
  const anchor = id || makeId(text);
  return new Paragraph({
    children: [
      new InternalHyperlink({
        anchor,
        children: [new TextRun({ text, font: TNR, size: BODY_SIZE })],
      }),
      new TextRun({ text: '\t', font: TNR, size: BODY_SIZE }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: 9240, leader: 'dot' }],
    indent: { left: 720 },
    spacing: makeSpacing(20, 20),
  });
}

// Mục trong danh mục bảng/hình (có dấu chấm dẫn + số trang, giống mục lục)
function tocEntry(text, page) {
  return new Paragraph({
    children: [
      new TextRun({ text, font: TNR, size: BODY_SIZE }),
      new TextRun({ text: '\t', font: TNR, size: BODY_SIZE }),
      new TextRun({ text: String(page), font: TNR, size: BODY_SIZE }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: 9071, leader: 'dot' }],
    spacing: makeSpacing(40, 40),
  });
}

// Ô trong bảng
function tcHeader(text) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: TNR, size: BODY_SIZE, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
    })],
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}
function tcData(text, center = false) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: TNR, size: BODY_SIZE })],
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
    })],
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
  });
}

// ============================================================
// DANH MỤC TỪ VIẾT TẮT
// ============================================================
const abbrevData = [
  { abbr: "API",      eng: "Application Programming Interface",    viet: "Giao diện lập trình ứng dụng" },
  { abbr: "APWG",     eng: "Anti-Phishing Working Group",           viet: "" },
  { abbr: "AUC",      eng: "Area Under the Curve",                  viet: "Diện tích dưới đường cong" },
  { abbr: "CSS",      eng: "Cascading Style Sheets",                viet: "" },
  { abbr: "DGA",      eng: "Domain Generation Algorithm",           viet: "Thuật toán sinh tên miền" },
  { abbr: "DNS",      eng: "Domain Name System",                    viet: "Hệ thống phân giải tên miền" },
  { abbr: "DT",       eng: "Decision Tree",                         viet: "Cây quyết định" },
  { abbr: "FNR",      eng: "False Negative Rate",                   viet: "Tỷ lệ bỏ sót" },
  { abbr: "FPR",      eng: "False Positive Rate",                   viet: "Tỷ lệ báo động giả" },
  { abbr: "HTML",     eng: "HyperText Markup Language",             viet: "Ngôn ngữ đánh dấu siêu văn bản" },
  { abbr: "HTTP",     eng: "HyperText Transfer Protocol",           viet: "Giao thức truyền tải siêu văn bản" },
  { abbr: "HTTPS",    eng: "HyperText Transfer Protocol Secure",    viet: "Giao thức siêu văn bản bảo mật" },
  { abbr: "JSON",     eng: "JavaScript Object Notation",            viet: "" },
  { abbr: "LightGBM", eng: "Light Gradient Boosting Machine",       viet: "" },
  { abbr: "LR",       eng: "Logistic Regression",                   viet: "Hồi quy logistic" },
  { abbr: "MCC",      eng: "Matthews Correlation Coefficient",      viet: "Hệ số tương quan Matthews" },
  { abbr: "ML",       eng: "Machine Learning",                      viet: "Học máy" },
  { abbr: "PCA",      eng: "Principal Component Analysis",          viet: "Phân tích thành phần chính" },
  { abbr: "RF",       eng: "Random Forest",                         viet: "Rừng ngẫu nhiên" },
  { abbr: "ROC",      eng: "Receiver Operating Characteristic",     viet: "Đặc trưng vận hành bộ thu" },
  { abbr: "SMOTE",    eng: "Synthetic Minority Over-Sampling Technique", viet: "Kỹ thuật tạo mẫu thiểu số tổng hợp" },
  { abbr: "SOC",      eng: "Security Operations Center",            viet: "Trung tâm điều hành an ninh mạng" },
  { abbr: "SSL",      eng: "Secure Sockets Layer",                  viet: "Giao thức lớp ổ bảo mật" },
  { abbr: "SVM",      eng: "Support Vector Machine",                viet: "Máy vectơ hỗ trợ" },
  { abbr: "TLS",      eng: "Transport Layer Security",              viet: "Bảo mật lớp giao vận" },
  { abbr: "URL",      eng: "Uniform Resource Locator",              viet: "Địa chỉ tài nguyên thống nhất" },
  { abbr: "XGBoost",  eng: "eXtreme Gradient Boosting",             viet: "" },
];

function makeAbbrevTable(data) {
  return new Table({
    width: { size: 9240, type: WidthType.DXA },
    columnWidths: [700, 1300, 3620, 3620],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcHeader("STT"),
          tcHeader("TỪ VIẾT TẮT"),
          tcHeader("TIẾNG ANH"),
          tcHeader("TIẾNG VIỆT"),
        ],
      }),
      ...data.map((item, idx) => new TableRow({
        children: [
          tcData(String(idx + 1), true),
          tcData(item.abbr, true),
          tcData(item.eng),
          tcData(item.viet),
        ],
      })),
    ],
  });
}

// ============================================================
// DOCUMENT CONTENT
// ============================================================
const children = [

  // ---- TRANG PHỤ BÌA: ĐỂ TRỐNG (chỉnh thủ công) ----
  new Paragraph({ children: [new TextRun("")], spacing: makeSpacing(0, 0) }),

  // ---- LỜI CẢM ƠN ----
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "LỜI CẢM ƠN", font: TNR, size: HEADING_CH, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(0, 240),
    pageBreakBefore: true,
  }),
  body("Tôi xin gửi lời cảm ơn chân thành và sâu sắc đến cô Đinh Huỳnh Tuệ Tuệ, giảng viên hướng dẫn đề tài, đã tận tình chỉ dẫn, định hướng và góp ý trong suốt quá trình thực hiện đồ án. Sự hỗ trợ quý báu của cô đã giúp tôi vượt qua nhiều khó khăn về chuyên môn và hoàn thiện đề tài theo đúng định hướng."),
  body("Tôi cũng xin trân trọng cảm ơn quý thầy cô trong Khoa Công nghệ Thông tin, Trường Đại học Công nghệ TP.HCM đã truyền đạt những kiến thức nền tảng vững chắc trong suốt các năm học, tạo tiền đề quan trọng để tôi tiếp cận và giải quyết các vấn đề kỹ thuật trong đồ án này."),
  body("Cuối cùng, tôi xin bày tỏ lòng biết ơn đến gia đình và bạn bè đã luôn động viên, chia sẻ và tạo điều kiện tốt nhất cho tôi trong suốt quá trình học tập và nghiên cứu."),
  emptyLine(),
  new Paragraph({
    children: [new TextRun({ text: "TP. Hồ Chí Minh, tháng 3 năm 2026", font: TNR, size: BODY_SIZE, italics: true })],
    alignment: AlignmentType.RIGHT,
    spacing: makeSpacing(0, 60),
  }),
  new Paragraph({
    children: [new TextRun({ text: "Sinh viên thực hiện", font: TNR, size: BODY_SIZE, bold: true })],
    alignment: AlignmentType.RIGHT,
    spacing: makeSpacing(0, 240),
  }),
  new Paragraph({
    children: [new TextRun({ text: "Trần Duy Thái", font: TNR, size: BODY_SIZE, bold: true })],
    alignment: AlignmentType.RIGHT,
    spacing: makeSpacing(0, 120),
  }),

  // ---- LỜI MỞ ĐẦU ----
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "LỜI MỞ ĐẦU", font: TNR, size: HEADING_CH, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(0, 240),
    pageBreakBefore: true,
  }),
  body("Trong thập kỷ qua, ứng dụng web đã trở thành hạ tầng kỹ thuật số không thể thiếu của mọi lĩnh vực kinh tế và xã hội, từ thương mại điện tử, y tế, giáo dục đến quản lý hành chính công. Theo thống kê của Netcraft, tính đến đầu năm 2025 có hơn 1,1 tỷ website đang hoạt động trên toàn cầu. Sự bùng nổ này kéo theo một rủi ro nghiêm trọng: lừa đảo trực tuyến thông qua URL giả mạo đã trở thành vectơ tấn công hàng đầu, gây thiệt hại kinh tế hàng chục tỷ USD mỗi năm."),
  body("Thực tế cho thấy các giải pháp bảo mật truyền thống dựa trên danh sách đen đang ngày càng tỏ ra bất lực trước các URL lừa đảo mới xuất hiện liên tục. Kẻ tấn công liên tục thay đổi URL với tuổi thọ trung bình chỉ 15 đến 20 giờ, trong khi các hệ thống cập nhật danh sách đen mất từ vài giờ đến vài ngày, tạo ra khoảng thời gian phơi nhiễm nguy hiểm cho người dùng."),
  body("Xuất phát từ thực tiễn đó, đề tài này nghiên cứu và xây dựng một tiện ích mở rộng trên trình duyệt Chrome kết hợp nhiều lớp phòng thủ gồm danh sách đen, danh sách trắng, phương pháp heuristic, phân tích DOM và mô hình học máy để phát hiện URL lừa đảo theo thời gian thực trực tiếp trên trình duyệt, không yêu cầu người dùng có kiến thức chuyên sâu về an toàn thông tin."),
  body("Đề tài tập trung đánh giá và so sánh toàn diện sáu thuật toán học máy gồm Logistic Regression, Decision Tree, SVM, Random Forest, LightGBM và XGBoost trên tập dữ liệu kết hợp từ PhishTank, OpenPhish và Alexa Top 1 Million, từ đó chọn ra mô hình tối ưu để triển khai nhẹ tại phía client dưới dạng file JSON đọc được bằng JavaScript thuần."),
  emptyLine(),
  new Paragraph({
    children: [new TextRun({ text: "TP. Hồ Chí Minh, tháng 3 năm 2026", font: TNR, size: BODY_SIZE, italics: true })],
    alignment: AlignmentType.RIGHT,
    spacing: makeSpacing(0, 120),
  }),
  new Paragraph({
    children: [new TextRun({ text: "Trần Duy Thái", font: TNR, size: BODY_SIZE, bold: true })],
    alignment: AlignmentType.RIGHT,
    spacing: makeSpacing(0, 120),
  }),

  // ---- LỜI CAM ĐOAN ----
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "LỜI CAM ĐOAN", font: TNR, size: HEADING_CH, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(0, 240),
    pageBreakBefore: true,
  }),
  body("Tôi xin cam đoan đây là công trình nghiên cứu của riêng tôi và được sự hướng dẫn của giảng viên hướng dẫn. Các nội dung nghiên cứu, kết quả trong đề tài này là trung thực và chưa công bố dưới bất kỳ hình thức nào trước đây."),
  body("Những số liệu, tài liệu phục vụ cho việc phân tích, nhận xét, đánh giá được chính tác giả thu thập từ các nguồn khác nhau có ghi rõ trong phần tài liệu tham khảo."),
  body("Nếu phát hiện có bất kỳ sự gian lận nào tôi xin hoàn toàn chịu trách nhiệm về nội dung đồ án của mình."),
  emptyLine(),
  new Paragraph({
    children: [new TextRun({ text: "TP. Hồ Chí Minh, tháng 3 năm 2026", font: TNR, size: BODY_SIZE })],
    alignment: AlignmentType.RIGHT,
    spacing: makeSpacing(0, 120),
  }),
  new Paragraph({
    children: [new TextRun({ text: "Sinh viên thực hiện", font: TNR, size: BODY_SIZE, bold: true })],
    alignment: AlignmentType.RIGHT,
    spacing: makeSpacing(0, 120),
  }),
  new Paragraph({
    children: [new TextRun({ text: "(Ký và ghi rõ họ tên)", font: TNR, size: BODY_SIZE, italics: true })],
    alignment: AlignmentType.RIGHT,
    spacing: makeSpacing(0, 240),
  }),
  new Paragraph({
    children: [new TextRun({ text: "Trần Duy Thái", font: TNR, size: BODY_SIZE, bold: true })],
    alignment: AlignmentType.RIGHT,
    spacing: makeSpacing(0, 120),
  }),

  // ---- MỤC LỤC TỰ ĐỘNG (Word sẽ tự tạo từ Heading 1/2/3) ----
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "MỤC LỤC", font: TNR, size: HEADING_CH, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(0, 180),
    pageBreakBefore: true,
  }),
  new TableOfContents("MỤC LỤC", {
    hyperlink: true,
    headingStyleRange: "1-3",
  }),

  // ---- DANH MỤC TỪ VIẾT TẮT ----
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "DANH MỤC CÁC KÝ HIỆU VÀ TỪ VIẾT TẮT", font: TNR, size: HEADING_CH, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(0, 240),
    pageBreakBefore: true,
  }),
  makeAbbrevTable(abbrevData),

  // ---- DANH MỤC CÁC BẢNG ----
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "DANH MỤC CÁC BẢNG", font: TNR, size: HEADING_CH, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(0, 240),
    pageBreakBefore: true,
  }),
  tocEntry("Bảng 3.1. Kết quả so sánh hiệu suất sáu mô hình phân loại", 26),
  tocEntry("Bảng 3.2. So sánh XGBoost mặc định và XGBoost sau tối ưu", 28),
  tocEntry("Bảng 3.3. Kết quả kiểm thử toàn diện 105 URL trên Chrome Extension", 29),
  tocEntry("Bảng 3.4. Hiệu năng tiện ích mở rộng", 30),

  // ---- DANH MỤC CÁC HÌNH VẼ, ĐỒ THỊ ----
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "DANH MỤC CÁC HÌNH VẼ, ĐỒ THỊ", font: TNR, size: HEADING_CH, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(0, 240),
    pageBreakBefore: true,
  }),
  tocEntry("Hình 3.1. Biểu đồ tầm quan trọng đặc trưng (feature_importance.png)", 27),
  tocEntry("Hình 3.2. Đường cong ROC của sáu mô hình (roc_curves.png)", 27),

  // ============================================================
  // CHƯƠNG 1: TỔNG QUAN
  // ============================================================
  chapterHeading("Chương 1. Tổng quan"),

  sectionHeading("1.1. Giới thiệu đề tài"),
  body("Trong bối cảnh chuyển đổi số diễn ra mạnh mẽ tại Việt Nam và toàn cầu, lừa đảo trực tuyến thông qua các URL giả mạo đã trở thành một trong những mối đe dọa an ninh mạng nghiêm trọng và phổ biến nhất hiện nay. Người dùng thường xuyên bị lừa truy cập vào các trang web giả mạo hệ thống ngân hàng thương mại, cổng email doanh nghiệp hoặc các dịch vụ hành chính trực tuyến, dẫn đến nguy cơ mất thông tin cá nhân và tài sản tài chính."),
  body("Theo báo cáo tình báo mối đe dọa của tổ chức IBM X-Force, lừa đảo trực tuyến hiện vẫn tiếp tục giữ vị trí vectơ tấn công hàng đầu được tin tặc sử dụng để xâm nhập vào hệ thống. Số lượng các cuộc tấn công phishing toàn cầu đã đạt mức kỷ lục 1.270.883 cuộc chỉ trong quý 3 năm 2022 và tiếp tục duy trì ở gần 1 triệu chiến dịch trong quý 1 năm 2025, gây thiệt hại kinh tế ước tính 16,6 tỷ USD theo báo cáo của FBI năm 2024."),
  body("Các giải pháp truyền thống dựa trên danh sách đen như Google Safe Browsing và PhishTank hiện đang tỏ ra bất lực trước các URL lừa đảo mới. Kẻ tấn công liên tục tạo ra các URL mới với tuổi thọ trung bình chỉ 15 đến 20 giờ, trong khi việc cập nhật danh sách đen mất từ vài giờ đến vài ngày, tạo ra khoảng thời gian phơi nhiễm nguy hiểm cho người dùng chưa được bảo vệ."),
  body("Vì vậy, đề tài này tập trung xây dựng một tiện ích mở rộng trên trình duyệt Chrome kết hợp danh sách đen, phương pháp heuristic và mô hình học máy để phát hiện URL lừa đảo theo thời gian thực trực tiếp trên trình duyệt, không yêu cầu người dùng có kiến thức chuyên sâu về an toàn thông tin."),

  sectionHeading("1.2. Mục tiêu nghiên cứu"),
  body("Đề tài hướng đến xây dựng một bộ dữ liệu huấn luyện cân bằng và đầy đủ hai lớp bằng cách kết hợp nguồn URL lừa đảo từ PhishTank và OpenPhish với nguồn URL hợp lệ từ Alexa Top 1 Million và Cisco Umbrella, đồng thời xử lý mất cân bằng dữ liệu bằng kỹ thuật SMOTE. Trên bộ dữ liệu đó, đề tài thực hiện đánh giá đối chuẩn toàn diện sáu thuật toán học máy gồm Logistic Regression, Decision Tree, SVM, Random Forest, LightGBM và XGBoost, với mục tiêu đạt độ chính xác từ 80% trở lên, F1-Score từ 85% trở lên và tỷ lệ báo động giả không vượt quá 5%."),
  body("Từ kết quả so sánh đó, đề tài lựa chọn mô hình tốt nhất để tích hợp vào tiện ích mở rộng Chrome theo chuẩn Manifest V3, kết hợp cùng hai lớp phòng thủ còn lại để phát hiện URL lừa đảo theo thời gian thực với độ trễ suy luận dưới 200ms. Toàn bộ kết quả nghiên cứu được công bố kèm mã nguồn, báo cáo phân tích và video demo minh họa."),

  sectionHeading("1.3. Đối tượng và phạm vi nghiên cứu"),
  body("Đối tượng nghiên cứu của đề tài bao gồm ba nhóm chính:"),
  listItem("1.", "URL lừa đảo và các đặc trưng ngữ vựng của chúng."),
  listItem("2.", "Các thuật toán học máy cho bài toán phân loại nhị phân URL an toàn và URL lừa đảo."),
  listItem("3.", "Kiến trúc tiện ích mở rộng Chrome theo chuẩn Manifest V3."),
  body("Phạm vi nghiên cứu được giới hạn trong ba khía cạnh sau:"),
  listItem("1.", "Chỉ sử dụng đặc trưng ngữ vựng tĩnh trích xuất từ chuỗi URL, không phân tích nội dung trang HTML hay thực hiện yêu cầu mạng, nhằm đảm bảo an toàn và tốc độ xử lý."),
  listItem("2.", "Dữ liệu huấn luyện lấy từ các nguồn công khai gồm PhishTank, OpenPhish cho URL lừa đảo và Alexa Top 1 Million, Cisco Umbrella cho URL hợp lệ, kết hợp ISCX-URL2016 làm tập dữ liệu tham chiếu."),
  listItem("3.", "Hệ thống hướng đến triển khai trên trình duyệt Google Chrome, đóng gói dưới dạng file .crx theo chuẩn Manifest V3."),

  sectionHeading("1.4. Ý nghĩa khoa học và thực tiễn"),
  body("Về ý nghĩa khoa học, đề tài đóng góp vào cơ sở nghiên cứu về ứng dụng học máy trong an toàn thông tin thông qua việc đánh giá đối chuẩn toàn diện sáu thuật toán phân loại trên tập dữ liệu kết hợp sau xử lý SMOTE, đề xuất quy trình trích xuất và tối ưu hóa đặc trưng ngữ vựng URL kết hợp giảm chiều PCA phù hợp với môi trường triển khai nhẹ tại phía client, và đánh giá đa chiều qua các chỉ số Accuracy, F1-Score, ROC-AUC, MCC, FPR, FNR cùng độ trễ suy luận."),
  body("Về ý nghĩa thực tiễn, sản phẩm tiện ích mở rộng Chrome của đề tài hỗ trợ trực tiếp người dùng cá nhân và doanh nghiệp phát hiện và ngăn chặn các cuộc tấn công lừa đảo theo thời gian thực, giảm thiểu rủi ro đánh cắp thông tin và gian lận ngân hàng trực tuyến. Hệ thống được thiết kế nhẹ, không chiếm nhiều tài nguyên trình duyệt và có thể triển khai ngay cho người dùng phổ thông mà không cần cấu hình phức tạp."),

  sectionHeading("1.5. Cấu trúc đồ án"),
  body("Ngoài phần mở đầu và tài liệu tham khảo, đồ án được tổ chức thành bốn chương với nội dung cụ thể như sau."),
  body("Chương 1: Tổng quan. Trình bày bối cảnh nghiên cứu, tính cấp thiết của đề tài, mục tiêu, đối tượng, phạm vi nghiên cứu và cấu trúc tổng thể của đồ án."),
  body("Chương 2: Cơ sở lý thuyết. Trình bày các khái niệm và phương pháp giải quyết vấn đề bao gồm tổng quan về phishing URL, các phương pháp phát hiện, kỹ thuật trích xuất đặc trưng và giảm chiều, nguồn dữ liệu và quy trình xử lý mất cân bằng, các thuật toán học máy được sử dụng, chỉ số đánh giá hiệu suất và kiến trúc tiện ích mở rộng Chrome Manifest V3."),
  body("Chương 3: Kết quả thực nghiệm. Mô tả môi trường thực nghiệm, thiết kế hệ thống, kết quả huấn luyện và so sánh mô hình, cùng với demo hoạt động của tiện ích mở rộng."),
  body("Chương 4: Kết luận và kiến nghị. Tổng hợp các kết quả đạt được, đánh giá những hạn chế còn tồn tại và đề xuất hướng phát triển trong tương lai."),

  // ============================================================
  // CHƯƠNG 2: CƠ SỞ LÝ THUYẾT
  // ============================================================
  chapterHeading("Chương 2. Cơ sở lý thuyết"),

  sectionHeading("2.1. Tổng quan về Phishing URL"),

  subHeading("2.1.1. Khái niệm và phân loại"),
  body("Phishing hay tấn công giả mạo là một hình thức tấn công mạng sử dụng kỹ thuật thao túng tâm lý và các thủ đoạn kỹ thuật để lừa gạt người dùng. Thay vì nhắm vào các lỗ hổng của hệ thống phần mềm, phishing khai thác trực tiếp điểm yếu của con người. Kẻ tấn công thường mạo danh các tổ chức uy tín như ngân hàng, công ty công nghệ hay cơ quan chính phủ để gửi đi các tin nhắn hoặc email chứa URL độc hại. Khi nạn nhân nhấp vào các URL này, họ bị điều hướng đến các trang web giả mạo nhằm đánh cắp thông tin nhạy cảm như thông tin đăng nhập, dữ liệu thẻ tín dụng, hoặc bị bí mật cài đặt mã độc vào thiết bị."),
  body("Các hình thức phishing ngày càng đa dạng và tinh vi, được phân loại chủ yếu dựa trên phương thức tiếp cận và mục tiêu tấn công:"),
  listItem("1.", "Email Phishing là hình thức phổ biến nhất, trong đó kẻ tấn công gửi email chứa URL độc hại đến hàng loạt người dùng ngẫu nhiên."),
  listItem("2.", "Spear Phishing là dạng lừa đảo có mục tiêu, kẻ tấn công thu thập thông tin về một cá nhân hoặc tổ chức cụ thể để soạn email mạo danh mang tính cá nhân hóa cao."),
  listItem("3.", "Whaling là dạng nâng cấp của Spear Phishing, nhắm vào các nhân vật cấp cao như giám đốc điều hành để chiếm đoạt quyền truy cập sâu hơn vào hệ thống cốt lõi."),
  listItem("4.", "Smishing và Vishing là lừa đảo thông qua tin nhắn SMS chứa URL độc hại hoặc qua các cuộc gọi điện thoại giả mạo để ép buộc nạn nhân cung cấp thông tin."),
  listItem("5.", "Pharming là kỹ thuật đánh lừa hệ thống DNS khiến nạn nhân bị định tuyến đến trang web giả mạo ngay cả khi gõ đúng địa chỉ hợp lệ."),
  listItem("6.", "Clone Phishing là tấn công nhân bản, kẻ tấn công tạo bản sao y hệt email hợp pháp mà nạn nhân đã nhận nhưng thay thế các liên kết an toàn bằng URL độc hại."),

  subHeading("2.1.2. Thực trạng và xu hướng"),
  body("Trên bình diện toàn cầu, tình hình lừa đảo trực tuyến đang bùng nổ với tốc độ cấp số nhân. Theo Nhóm Công tác Chống Phishing (APWG), số lượng các cuộc tấn công liên tục phá vỡ kỷ lục lịch sử: từ mốc 180.000 trang web phishing độc nhất trong quý 1 năm 2019, đã tăng vọt lên mức 1.270.883 cuộc tấn công chỉ trong quý 3 năm 2022, trong đó 23,2% nhắm vào lĩnh vực tài chính. Đến quý 4 năm 2023, hệ thống ghi nhận 989.123 cuộc tấn công với mục tiêu hàng đầu chuyển dịch sang nền tảng mạng xã hội chiếm 42,8%. Trong quý 1 năm 2025, đã có gần 1 triệu chiến dịch tấn công được triển khai."),
  body("Sự nguy hiểm của phishing còn thể hiện qua mức độ thiệt hại kinh tế khổng lồ. Theo báo cáo của FBI năm 2024, phishing là nguyên nhân chính đóng góp vào khoản thiệt hại 16,6 tỷ USD do gian lận mạng. Tội phạm mạng toàn cầu được dự báo sẽ gây thiệt hại lên tới 10,5 nghìn tỷ USD mỗi năm vào năm 2025. Đặc biệt, tỷ lệ các liên kết mạng xã hội trong email độc hại đã tăng 600% so với năm 2023."),
  body("Tại Việt Nam, lừa đảo trực tuyến được xếp vào nhóm rủi ro an ninh mạng ở mức độ cao nhất. Theo báo cáo IBM X-Force, phishing vẫn tiếp tục giữ vị trí vectơ tấn công hàng đầu. Phương thức phổ biến là lừa người dùng Việt Nam truy cập vào các website giả mạo hệ thống ngân hàng thương mại, cổng email doanh nghiệp hoặc các dịch vụ hành chính trực tuyến nhằm đánh cắp tài khoản và chiếm đoạt tài sản."),

  // ---- 2.2 Các phương pháp phát hiện ----
  sectionHeading("2.2. Các phương pháp phát hiện Phishing URL"),

  subHeading("2.2.1. Phương pháp danh sách đen"),
  body("Phương pháp danh sách đen duy trì một cơ sở dữ liệu chứa các URL, tên miền hoặc địa chỉ IP đã được xác nhận là độc hại trong quá khứ. Khi người dùng truy cập một URL, hệ thống thực hiện truy vấn đối chiếu; nếu URL đó có mặt trong danh sách, quyền truy cập sẽ bị chặn và cảnh báo được phát ra. Google Safe Browsing là ví dụ điển hình của phương pháp này."),
  body("Ưu điểm của phương pháp này là tốc độ truy vấn cực kỳ nhanh, độ trễ thấp và rất dễ triển khai. Phương pháp mang lại tỷ lệ báo động giả cực thấp đối với các mối đe dọa đã biết."),
  body("Nhược điểm là mang tính bị động, không bao giờ có thể liệt kê đầy đủ mọi URL độc hại do lượng URL mới sinh ra mỗi ngày là quá lớn. Kẻ tấn công dễ dàng vượt qua bằng cách thay đổi một chi tiết nhỏ trong URL. Quan trọng hơn, các URL lừa đảo hoàn toàn mới chưa kịp cập nhật vào cơ sở dữ liệu sẽ không bị phát hiện. Nghiên cứu chỉ ra rằng tuổi thọ trung bình của một trang web phishing chỉ từ 15 đến 20 giờ, trong khi việc phân phối bản cập nhật danh sách đen mất từ vài giờ đến vài ngày."),

  subHeading("2.2.2. Phương pháp heuristic"),
  body("Phương pháp heuristic phân tích các đặc trưng tĩnh, hành vi hoặc cấu trúc của URL và trang web như tuổi đời tên miền, tính hợp lệ của chứng chỉ SSL, số lượng ký tự đặc biệt, sự xuất hiện của biểu mẫu nhập liệu nhạy cảm để đánh giá mức độ rủi ro dựa trên các quy tắc được định nghĩa trước."),
  body("Ưu điểm là có khả năng phát hiện các cuộc tấn công mới miễn là trang web mang những dấu hiệu lừa đảo phổ biến đã được định nghĩa trong quy tắc. Nhược điểm là tỷ lệ báo động giả thường cao vì các trang web hợp lệ hoàn toàn có thể vô tình mang các đặc điểm bị nghi ngờ. Do bộ quy tắc mang tính tĩnh, kẻ tấn công dễ dàng qua mặt bằng các kỹ thuật gây nhiễu hoặc ẩn nội dung độc hại."),

  subHeading("2.2.3. Phương pháp học máy"),
  body("Học máy giải quyết triệt để những hạn chế của hai phương pháp trên bằng cách tự động hóa việc trích xuất và học hỏi từ hàng nghìn đặc trưng tinh vi của hàng triệu URL. Khác với hệ thống quy tắc tĩnh, học máy có khả năng nhận diện các ranh giới phi tuyến tính phức tạp và tìm ra các mẫu ẩn sâu trong dữ liệu, giúp phát hiện chính xác các URL lừa đảo mới chưa từng tồn tại trước đây."),
  body("Các thuật toán học máy tiên tiến, đặc biệt là nhóm mô hình tập hợp như Random Forest hay XGBoost, cho phép đạt độ chính xác vượt trội thường từ 95% đến hơn 99%, đồng thời giảm thiểu tối đa các báo động nhầm. Mô hình có thể duy trì tính linh hoạt, thích ứng với các kỹ thuật né tránh mới bằng cách liên tục huấn luyện lại trên dữ liệu cập nhật."),

  // ---- 2.3 Đặc trưng ngữ vựng URL ----
  sectionHeading("2.3. Đặc trưng ngữ vựng URL"),

  subHeading("2.3.1. Các đặc trưng quan trọng"),
  body("Đặc trưng ngữ vựng là các thuộc tính văn bản tĩnh được trích xuất trực tiếp từ chuỗi URL mà không cần tải nội dung trang web hay thực thi mã lệnh, đảm bảo an toàn tuyệt đối và tốc độ xử lý nhanh theo thời gian thực. Các nhóm đặc trưng quan trọng nhất bao gồm:"),
  listItem("1.", "Cấu trúc và độ dài URL: Kẻ tấn công thường sử dụng các URL rất dài để che giấu tên miền lừa đảo thực sự. Việc đo lường độ dài của toàn bộ chuỗi URL, độ dài tên miền và độ dài đường dẫn là những chỉ báo phân loại rất mạnh."),
  listItem("2.", "Sự hiện diện của địa chỉ IP: Các URL hợp lệ thường sử dụng tên miền. Việc một URL sử dụng trực tiếp địa chỉ IP thường là dấu hiệu rõ ràng của ý đồ độc hại nhằm che giấu nguồn gốc hoặc vượt qua các hệ thống đánh giá uy tín tên miền."),
  listItem("3.", "Số lượng tên miền phụ: URL lừa đảo thường tạo ra nhiều cấp độ tên miền phụ để đánh lừa người dùng. Số lượng dấu chấm và mức độ phức tạp của tên miền phụ càng cao thì rủi ro lừa đảo càng lớn."),
  listItem("4.", "Tần suất ký tự đặc biệt: Việc đếm số lượng các ký tự như @, ?, =, // vô cùng quan trọng. Kẻ tấn công sử dụng chúng để gây nhiễu, ví dụ trình duyệt bỏ qua toàn bộ phần nằm trước @ trong URL."),
  listItem("5.", "Từ khóa lừa đảo và giả mạo thương hiệu: Các URL độc hại thường chứa các từ khóa nhạy cảm như login, secure, verify, update, account hoặc chứa tên của các thương hiệu lớn nhằm tạo sự tin tưởng."),
  listItem("6.", "Tỷ lệ chữ số và chỉ số entropy: Các tên miền được tạo tự động bằng thuật toán thường chứa chuỗi ký tự ngẫu nhiên hoặc có tỷ lệ chữ số cao bất thường. Tính toán chỉ số entropy giúp mô hình nhận diện các chuỗi không có cấu trúc ngôn ngữ tự nhiên."),

  subHeading("2.3.2. Kỹ thuật giảm chiều dữ liệu"),
  body("Khi thu thập đặc trưng từ các nguồn dữ liệu lớn, số lượng cột đặc trưng có thể tăng lên rất cao. Việc giữ lại các đặc trưng dư thừa hoặc nhiễu có thể gây ra hiện tượng học vẹt và làm tăng độ phức tạp tính toán. Đề tài sử dụng hai kỹ thuật giảm chiều chính."),
  body("Ma trận tương quan đánh giá mối quan hệ tuyến tính giữa các cặp đặc trưng. Nếu hai đặc trưng có hệ số tương quan quá cao, chúng mang nội dung thông tin gần như giống hệt nhau và ta có thể an toàn loại bỏ một trong hai, giúp giảm thiểu độ nhiễu và độ phức tạp."),
  body("Phân tích thành phần chính (PCA) biến đổi tập hợp các đặc trưng ban đầu thành một tập hợp các thành phần chính hoàn toàn không tương quan với nhau, đồng thời giữ lại được phương sai lớn nhất từ tập dữ liệu gốc. Trong thực tế, PCA có thể nén hiệu quả một tập dữ liệu từ 50 thuộc tính xuống chỉ còn 18 thuộc tính cốt lõi mà không làm suy giảm đáng kể độ chính xác. Việc kết hợp hai kỹ thuật này giúp giảm lượng bộ nhớ sử dụng, tăng tốc độ hội tụ khi huấn luyện và giảm độ trễ khi dự đoán, đảm bảo hệ thống đủ nhẹ để tích hợp vào tiện ích mở rộng Chrome."),

  // ---- 2.4 Dữ liệu và tiền xử lý ----
  sectionHeading("2.4. Dữ liệu và tiền xử lý"),

  subHeading("2.4.1. Nguồn dữ liệu"),
  body("Bộ dữ liệu huấn luyện được xây dựng từ sự kết hợp của nhiều nguồn độc lập, bao gồm cả hai lớp phân loại là URL lừa đảo và URL hợp lệ."),
  body("Nguồn URL lừa đảo được kết hợp từ PhishTank và OpenPhish nhằm tối đa hóa độ bao phủ. PhishTank cung cấp dữ liệu được cộng đồng xác minh thủ công với độ tin cậy cao; OpenPhish cung cấp dữ liệu phát hiện tự động theo thời gian thực trong vòng 5 phút. Do mức độ trùng lặp giữa hai nguồn chỉ khoảng 12%, việc kết hợp cả hai giúp mở rộng tổng diện tích bao phủ lên gần 88%."),
  body("Nguồn URL hợp lệ sử dụng Alexa Top 1 Million là danh sách một triệu tên miền có lưu lượng truy cập cao nhất thế giới. Đây là tiêu chuẩn thực tế được sử dụng rộng rãi nhất trong cộng đồng nghiên cứu phát hiện phishing, đại diện cho thói quen duyệt web thực tế của người dùng. Ngoài ra, Cisco Umbrella Top 1M được sử dụng bổ sung để tăng tính đa dạng."),
  body("Ngoài dữ liệu tự thu thập, đề tài sử dụng thêm UCI Phishing Websites Dataset và ISCX-URL2016 làm tập dữ liệu tham chiếu để kiểm tra chéo và so sánh kết quả với các nghiên cứu trước."),

  subHeading("2.4.2. Xử lý mất cân bằng dữ liệu"),
  body("Trong thực tế, tỷ lệ URL độc hại chỉ chiếm từ 0,05% đến 5% tổng lưu lượng web. Nếu không xử lý, mô hình sẽ bị thiên kiến về lớp đa số, dẫn đến tỷ lệ bỏ sót URL lừa đảo rất cao. Đây là rủi ro bảo mật nghiêm trọng nhất cần tránh. Đề tài áp dụng kết hợp hai kỹ thuật xử lý:"),
  listItem("1.", "Ở cấp độ dữ liệu: SMOTE sinh ra các mẫu tổng hợp cho lớp thiểu số bằng cách nội suy giữa các điểm dữ liệu phishing hiện có, giúp cải thiện đáng kể Recall và F1-Score."),
  listItem("2.", "Ở cấp độ thuật toán: Sử dụng tham số scale_pos_weight trong XGBoost và class_weight trong Scikit-learn để gán trọng số phạt lớn hơn cho lỗi phân loại sai URL lừa đảo thành URL hợp lệ."),
  body("Tỷ lệ phân chia tập huấn luyện và kiểm thử là 80/20 kết hợp phân chia phân tầng nhằm đảm bảo tỷ lệ hai lớp đồng nhất trong cả tập huấn luyện lẫn tập kiểm thử, ngăn ngừa rò rỉ dữ liệu. Sử dụng kiểm định chéo 5 lần để đánh giá độ ổn định của mô hình."),

  // ---- 2.5 Các thuật toán học máy ----
  sectionHeading("2.5. Các thuật toán học máy"),

  subHeading("2.5.1. Logistic Regression"),
  body("Logistic Regression được đưa vào như mô hình cơ sở nhằm cung cấp tiêu chuẩn so sánh tối thiểu để chứng minh sự cần thiết của các thuật toán phức tạp hơn. Nếu Random Forest, XGBoost hay LightGBM không mang lại độ chính xác vượt trội hơn Logistic Regression một cách đáng kể, thì Logistic Regression sẽ là lựa chọn tối ưu về chi phí tính toán."),
  body("Nguyên lý hoạt động: Logistic Regression là mô hình tuyến tính ánh xạ tổ hợp tuyến tính các đặc trưng URL sang xác suất thuộc lớp phishing qua hàm sigmoid. Ưu điểm nổi bật là khả năng diễn giải cao, tốc độ suy luận cực nhanh và xác suất đầu ra được hiệu chuẩn tốt giúp tinh chỉnh ngưỡng cảnh báo linh hoạt. Nhược điểm là giả định quan hệ tuyến tính giữa đặc trưng và nhãn, không nắm bắt được các tương tác phi tuyến phức tạp vốn phổ biến trong URL lừa đảo."),

  subHeading("2.5.2. Random Forest"),
  body("Random Forest là thuật toán học tập hợp hoạt động dựa trên kỹ thuật Bagging. Thuật toán này tạo ra nhiều tập dữ liệu con từ tập dữ liệu huấn luyện ban đầu bằng cách lấy mẫu ngẫu nhiên có thay thế."),
  body("Cấu trúc: Mô hình xây dựng một rừng gồm nhiều cây quyết định hoàn toàn độc lập và song song. Tại mỗi nút phân chia, Random Forest chỉ chọn ngẫu nhiên một tập con đặc trưng để tìm điểm chia cắt tối ưu. Kết quả dự đoán cuối cùng được tổng hợp bằng bỏ phiếu đa số từ tất cả các cây. Ưu điểm nổi bật là khả năng chống học vẹt rất tốt, ít nhạy cảm với nhiễu và cung cấp mức độ quan trọng của từng đặc trưng một cách trực quan. Trong bài toán phân loại phishing URL, Random Forest đạt độ chính xác từ 89,7% đến 97,6% với F1-Score từ 96,2% đến 97,2%."),

  subHeading("2.5.3. XGBoost"),
  body("XGBoost hoạt động dựa trên cơ chế Boosting, xây dựng các cây quyết định tuần tự trong đó mỗi cây tối ưu hóa hàm mất mát bằng Gradient Descent để sửa chữa lỗi của các cây trước. XGBoost vượt trội nhờ tích hợp sẵn điều chỉnh L1 và L2 ngăn học vẹt, thuật toán xử lý dữ liệu thiếu và hỗ trợ tính toán song song. Thuật toán đạt độ chính xác từ 94,2% đến 99,8% với tỷ lệ báo động giả thấp nhất là 2,3%."),
  body("Triển khai trong đề tài: Sau khi huấn luyện offline bằng Python, toàn bộ cấu trúc cây quyết định được xuất sang file JSON. Tiện ích mở rộng Chrome dùng JavaScript thuần đọc JSON và suy luận bằng logic IF-ELSE phía client, không cần thư viện học máy nặng và đảm bảo độ trễ dưới 200ms."),

  subHeading("2.5.4. LightGBM"),
  body("LightGBM là thuật toán Gradient Boosting được Microsoft phát triển với hai cải tiến kiến trúc cốt lõi so với XGBoost. Thứ nhất, học dựa trên histogram: thay vì duyệt toàn bộ dữ liệu, LightGBM phân nhóm các giá trị đặc trưng vào các bin histogram, giảm đáng kể bộ nhớ RAM và tăng tốc huấn luyện. Thứ hai, phát triển cây theo chiều lá: chọn lá có khả năng giảm sai số lớn nhất thay vì phát triển theo chiều sâu, giúp đạt độ chính xác cao hơn hoặc tương đương XGBoost trên cùng số lượng lá."),
  body("Lý do đưa LightGBM vào so sánh: Trong bối cảnh triển khai tiện ích mở rộng Chrome, kích thước file JSON của mô hình là yếu tố then chốt. LightGBM thường tạo ra file JSON nhỏ hơn XGBoost đáng kể do cơ chế histogram làm giảm số lượng điểm phân chia, giúp tăng tốc tải mô hình và giảm độ trễ suy luận phía client. Đây là ưu điểm trực tiếp phục vụ mục tiêu độ trễ dưới 200ms của đề tài."),

  subHeading("2.5.5. Support Vector Machine và Decision Tree"),
  body("Support Vector Machine tìm ra siêu phẳng tối ưu để phân tách hai lớp URL. Rất mạnh với ranh giới phi tuyến tính qua các hàm kernel RBF và Polynomial, nhưng tiêu tốn nhiều tài nguyên trên dữ liệu lớn và nhạy cảm với mất cân bằng lớp. Trong các nghiên cứu tham chiếu, SVM đạt độ chính xác từ 87,1% đến 95,8% nhưng có thể giảm xuống 72,2% khi dữ liệu mất cân bằng nghiêm trọng."),
  body("Decision Tree phân chia dữ liệu dựa trên tiêu chí tối đa hóa Information Gain hoặc giảm thiểu Gini Impurity. Dễ hiểu và dễ diễn giải nhưng dễ bị học vẹt khi không cắt tỉa. Decision Tree trong đề tài đóng vai trò là mô hình đơn lẻ yếu nhất để làm nổi bật lợi thế của các phương pháp tập hợp. Đạt độ chính xác từ 85,3% đến 96,0% với tỷ lệ báo động giả cao nhất khoảng 5,8%."),

  // ---- 2.6 Chỉ số đánh giá ----
  sectionHeading("2.6. Chỉ số đánh giá hiệu suất"),

  subHeading("2.6.1. Các chỉ số phân loại cơ bản"),
  body("Accuracy hay độ chính xác tổng thể là tỷ lệ số mẫu được phân loại đúng trên tổng số mẫu, được tính theo công thức:"),
  formula("Accuracy = (TP + TN) / (TP + TN + FP + FN)"),
  body("Tuy nhiên chỉ số này không đủ tin cậy khi dữ liệu mất cân bằng, vì một mô hình luôn dự đoán \"an toàn\" vẫn đạt Accuracy trên 95% nếu chỉ 5% mẫu là phishing."),
  body("Precision hay độ chụm đo lường trong số các URL bị đánh dấu là phishing, bao nhiêu thực sự là phishing:"),
  formula("Precision = TP / (TP + FP)"),
  body("Precision cao đồng nghĩa với tỷ lệ báo động giả thấp, tức ít chặn nhầm trang hợp lệ, giảm phiền nhiễu cho người dùng."),
  body("Recall hay độ nhạy đo lường trong số tất cả các URL phishing thực sự, bao nhiêu được phát hiện:"),
  formula("Recall = TP / (TP + FN)"),
  body("Recall cao đồng nghĩa với tỷ lệ bỏ sót thấp. Đây là chỉ số quan trọng nhất về mặt bảo mật."),
  body("F1-Score là trung bình điều hòa của Precision và Recall, giúp cân bằng giữa hai yêu cầu đối nghịch:"),
  formula("F1 = 2 × (Precision × Recall) / (Precision + Recall)"),

  subHeading("2.6.2. Chỉ số nâng cao"),
  body("ROC-AUC là diện tích dưới đường cong đặc trưng vận hành bộ thu, đánh giá khả năng phân loại tổng quát của mô hình ở mọi ngưỡng phân loại. Giá trị AUC bằng 1,0 là phân loại hoàn hảo; AUC bằng 0,5 tương đương đoán ngẫu nhiên. ROC-AUC đặc biệt hữu ích khi so sánh sức mạnh phân tách giữa các mô hình một cách công bằng."),
  body("MCC là hệ số tương quan Matthews, chỉ số mạnh nhất để đánh giá chất lượng phân loại trên tập dữ liệu mất cân bằng. MCC xem xét đồng thời cả bốn giá trị TP, TN, FP, FN để cho điểm số trong khoảng từ -1 đến +1. Giá trị MCC bằng +1 là phân loại hoàn hảo; MCC bằng 0 nghĩa là mô hình không tốt hơn đoán ngẫu nhiên. MCC đáng tin cậy hơn Accuracy và F1-Score khi tỷ lệ hai lớp chênh lệch lớn."),
  body("FPR và FNR là hai chỉ số bổ sung đánh giá chi phí của lỗi phân loại theo hai hướng. FPR đo tỷ lệ URL hợp lệ bị chặn nhầm, ảnh hưởng trực tiếp đến trải nghiệm người dùng:"),
  formula("FPR = FP / (FP + TN)"),
  body("FNR đo tỷ lệ URL phishing bị bỏ sót, ảnh hưởng trực tiếp đến mức độ bảo mật:"),
  formula("FNR = FN / (FN + TP)"),
  body("Mục tiêu của đề tài là tối thiểu hóa đồng thời cả FPR và FNR."),

  subHeading("2.6.3. Chỉ số hiệu năng thực thi"),
  body("Latency hay độ trễ suy luận là thời gian tính toán trung bình tính bằng millisecond để phân loại một URL, đo từ lúc nhận chuỗi URL đến lúc trả về kết quả. Đây là chỉ số quyết định khả năng triển khai thực tế: hệ thống phải hoàn thành suy luận trước khi trang web kịp tải trên trình duyệt. Mục tiêu của đề tài là độ trễ dưới 200ms. Việc xuất mô hình sang JSON và suy luận bằng JavaScript thuần phía client được kỳ vọng đạt mục tiêu này với biên độ an toàn."),
  body("Kích thước mô hình là kích thước file JSON ảnh hưởng đến thời gian tải tiện ích mở rộng lần đầu và bộ nhớ đệm chiếm dụng trong trình duyệt. Đây là lý do LightGBM được đưa vào so sánh bên cạnh XGBoost, vì trong nhiều trường hợp LightGBM tạo ra file nhỏ hơn với độ chính xác tương đương."),

  // ---- 2.7 Chrome Extension ----
  sectionHeading("2.7. Kiến trúc triển khai Chrome Extension Manifest V3"),

  subHeading("2.7.1. Kiến trúc phòng thủ nhiều lớp"),
  body("Tiện ích mở rộng Chrome theo chuẩn Manifest V3 được thiết kế theo mô hình phòng thủ nhiều lớp, kết hợp danh sách đen, danh sách trắng, quy tắc heuristic, học máy và phân tích DOM để bổ sung điểm mạnh của từng phương pháp cho nhau. Hệ thống gồm tám lớp xử lý tuần tự, mỗi lớp có thể kết thúc sớm nếu đủ căn cứ:"),
  listItem("Lớp 0.", "Tiền xử lý URL: Giải mã URL (decode) tối đa 3 vòng lặp để chống kỹ thuật né tránh bằng double encoding. Phát hiện địa chỉ IP riêng tư (RFC 1918) và localhost để tránh flag nhầm môi trường nội bộ. Nhận diện địa chỉ IP công cộng và hạ bậc cảnh báo để giảm false positive. Phát hiện homograph và tên miền IDN chứa ký tự không thuộc bảng Latin cơ bản (ví dụ: Cyrillic giả mạo), nếu kết hợp từ khóa thương hiệu thì block ngay với xác suất 95%."),
  listItem("Lớp 1.", "Danh sách tin cậy (Whitelist): Kiểm tra whitelist 50+ tên miền phổ biến được hardcode, kiểm tra subdomain của các nền tảng hosting uy tín như GitHub Pages và Vercel, và tra cứu danh sách Tranco Top 30.000 tên miền phổ biến nhất toàn cầu (442 KB). Tên miền giáo dục .edu.vn được tin tưởng do nhóm tên miền này được cấp phát và quản lý chặt chẽ bởi cơ quan nhà nước."),
  listItem("Lớp 2.", "Danh sách đen (Blacklist): Kiểm tra hostname với cơ sở dữ liệu 120+ URL nguy hiểm đã xác nhận, được lưu trữ trong file dangerous_urls.json. Hỗ trợ khớp chính xác (exact match) và khớp mẫu ký tự đại diện (wildcard matching). Nếu trùng khớp, chặn ngay lập tức với xác suất 98%."),
  listItem("Lớp 3.", "Phát hiện giả mạo thương hiệu: So sánh hostname với 7 thương hiệu lớn được cấu hình sẵn bao gồm PayPal, Google, Microsoft, Apple, Facebook, Amazon và FitGirl. Sử dụng thuật toán khoảng cách Levenshtein với ngưỡng 3 để phát hiện typosquatting như paypa1.com hay goggle.com. Kiểm tra cả exact keyword match và fuzzy domain matching."),
  listItem("Lớp 4.", "Heuristic dựa trên quy tắc: Kiểm tra 13 TLD đáng ngờ (.xyz, .tk, .pw, .cc, .top, .club, v.v.). Kết hợp TLD đáng ngờ với từ khóa phishing cho xác suất 97%; kết hợp với giả mạo thương hiệu cho 95%; TLD đáng ngờ đơn thuần cho 82%."),
  listItem("Lớp 5.", "Mô hình XGBoost ML: Suy luận bằng 300 cây quyết định trên 38 đặc trưng ngữ vựng. Áp dụng ngưỡng 3 bậc: An toàn (< 0,78), Cảnh báo (0,78-0,84) và Nguy hiểm (≥ 0,85). Địa chỉ IP công cộng được hạ một bậc để tránh false positive."),
  listItem("Lớp 6.", "Phân tích nội dung DOM: Kiểm tra sáu tín hiệu gồm form mật khẩu (+0,2), form action trỏ sang domain khác (+0,5), giả mạo thương hiệu trong tiêu đề trang kết hợp form đăng nhập (+0,4), iframe ẩn không thuộc domain tin cậy (+0,3), yêu cầu thông tin thẻ tín dụng trong form (+0,3), và phát hiện brand impersonation trực tiếp từ hostname không cần form (+0,6). Điểm tổng hợp từ lớp này bổ sung cho điểm ML."),
  listItem("Lớp 7.", "Kiểm tra tuổi tên miền RDAP: Truy vấn giao thức RDAP miễn phí để lấy ngày đăng ký tên miền. Tên miền dưới 7 ngày bị đánh dấu nguy hiểm nghiêm trọng; dưới 30 ngày là rủi ro cao. Thông tin được hiển thị trong banner cảnh báo để giúp người dùng đánh giá."),

  subHeading("2.7.2. Quy trình xử lý và triển khai mô hình"),
  body("Quy trình hoạt động của hệ thống diễn ra hoàn toàn tự động. Khi người dùng bắt đầu truy cập một trang web mới, Background Service Worker đánh chặn sự kiện điều hướng và inject tuần tự sáu file JavaScript: dangerous_url_checker.js (danh sách đen), feature_extractor.js (trích xuất đặc trưng), xgboost_predictor.js (suy luận ML), domain_age_checker.js (kiểm tra tuổi domain RDAP), content_analyzer.js (phân tích DOM) và content.js (điều phối tổng hợp và hiển thị banner). Mỗi lớp có thể kết thúc sớm và trả về kết quả ngay lập tức nếu đủ căn cứ, giúp tối ưu thời gian xử lý."),
  body("Về triển khai mô hình: Mô hình XGBoost được huấn luyện offline bằng Python trên 20.500 URL (20.000 gốc và 500 URL giả mạo thương hiệu bổ sung) với 38 đặc trưng. Toàn bộ cấu trúc 300 cây quyết định được xuất sang file JSON 402 KB và đóng gói bên trong tiện ích mở rộng. Tại phía client, JavaScript thuần duyệt cây IF-ELSE mà không cần thư viện học máy."),
  body("Kết quả suy luận được trình bày theo hệ thống 3 bậc: An toàn không hiển thị banner, Cảnh báo hiển thị banner màu cam kèm nút báo cáo an toàn, và Nguy hiểm hiển thị banner màu đỏ đậm. Mỗi cảnh báo đều kèm danh sách lý do cụ thể giúp người dùng hiểu được căn cứ phát hiện. Icon trên thanh công cụ trình duyệt thay đổi động theo trạng thái (xanh cho an toàn, cam cho cảnh báo, đỏ cho nguy hiểm) giúp người dùng nhận biết nhanh mà không cần mở trang. Giao diện popup hiển thị URL đang kiểm tra, thanh xác suất phishing trực quan và lý do phát hiện chi tiết theo phong cách dark theme chuyên nghiệp."),

  // ================================================================
  // CHƯƠNG 3 — THỰC NGHIỆM VÀ ĐÁNH GIÁ KẾT QUẢ
  // ================================================================
  chapterHeading("Chương 3. Thực nghiệm và đánh giá kết quả"),

  // ---- 3.1 Môi trường thực nghiệm ----
  sectionHeading("3.1. Môi trường thực nghiệm"),
  body("Thực nghiệm được tiến hành trên máy tính cá nhân với hệ điều hành Windows 11, bộ xử lý Intel Core i5-10300H, bộ nhớ RAM 16 GB. Ngôn ngữ lập trình Python phiên bản 3.11 cùng các thư viện chính: scikit-learn 1.4, XGBoost 2.0, LightGBM 4.3, imbalanced-learn 0.12, pandas 2.2 và matplotlib 3.9. Môi trường phát triển sử dụng Jupyter Notebook 7.0 để ghi lại toàn bộ quá trình thực nghiệm và kết quả theo định dạng tái lập được. Tiện ích mở rộng được kiểm thử trên trình duyệt Brave phiên bản 1.88.138, nền tảng Chromium 146.0.7680.178, tương thích hoàn toàn với Chrome Extension Manifest V3."),

  // ---- 3.2 Dữ liệu thực nghiệm ----
  sectionHeading("3.2. Dữ liệu thực nghiệm"),

  subHeading("3.2.1. Thu thập dữ liệu"),
  body("Tập dữ liệu được xây dựng từ hai nguồn công khai và được cộng đồng kiểm chứng. Nhóm URL lừa đảo gồm 10.000 URL được lấy từ PhishTank thông qua API CSV công khai. Nhóm URL hợp lệ gồm 10.000 URL từ Tranco Top 1 Million, danh sách tên miền phổ biến nhất toàn cầu. Kết quả là tập dữ liệu cân bằng hoàn toàn với 20.000 mẫu, tỷ lệ 1:1 giữa hai lớp."),

  subHeading("3.2.2. Trích xuất đặc trưng"),
  body("Từ mỗi URL, hệ thống trích xuất 38 đặc trưng ngữ vựng được chia thành năm nhóm. Nhóm đặc trưng URL cơ bản gồm 10 đặc trưng: độ dài URL, số dấu chấm, số dấu gạch ngang, số dấu gạch dưới, số dấu gạch chéo, số ký tự đặc biệt, tỷ lệ chữ số, tỷ lệ chữ cái, có cổng tường minh và entropy Shannon. Nhóm đặc trưng tên miền gồm 8 đặc trưng: độ dài tên miền, số tên miền phụ, có địa chỉ IP, có ký hiệu @, có chuyển hướng gạch chéo đôi, TLD đáng ngờ, có dấu gạch ngang trong tên miền và độ sâu tên miền phụ. Nhóm đặc trưng đường dẫn và truy vấn gồm 7 đặc trưng: độ dài đường dẫn, số tham số truy vấn, có phân đoạn, độ sâu đường dẫn, có mã hóa hex, số chữ số trong đường dẫn và entropy đường dẫn. Nhóm đặc trưng từ khóa gồm 5 đặc trưng: có từ khóa phishing, có từ khóa thương hiệu, có HTTPS, có từ đăng nhập và TLD đáng ngờ."),
  body("So với phiên bản gốc 30 đặc trưng, phiên bản cải tiến bổ sung thêm 8 đặc trưng phát hiện giả mạo thương hiệu gồm: brand_in_domain (từ khóa thương hiệu xuất hiện trong hostname), is_official_domain (domain chính thức của thương hiệu), is_brand_impersonation (kết quả kiểm tra tổng hợp), min_levenshtein_to_official (khoảng cách Levenshtein nhỏ nhất đến domain chính thức), is_typosquatting (typosquatting khoảng cách ≤ 2), brand_mismatch_score (điểm không khớp thương hiệu tổng hợp), has_phishing_keywords_enhanced (từ khóa phishing mở rộng) và combined_suspicious_score (điểm nghi ngờ tổng hợp). Toàn bộ 38 đặc trưng được tính toán từ chuỗi ký tự URL, không cần kết nối mạng, hoàn thành trong khoảng 2 giây trên 20.500 mẫu."),

  subHeading("3.2.3. Tiền xử lý và phân chia dữ liệu"),
  body("Tập dữ liệu được phân chia theo tỷ lệ 80:20 bằng kỹ thuật phân tầng, thu được 16.000 mẫu huấn luyện và 4.000 mẫu kiểm thử. Kỹ thuật SMOTE được áp dụng trên tập huấn luyện sau khi phân chia để tránh rò rỉ dữ liệu. StandardScaler được dùng riêng cho Logistic Regression và SVM do bản chất yêu cầu chuẩn hóa đặc trưng, trong khi các mô hình dựa trên cây quyết định không cần bước này."),

  // ---- 3.3 Kết quả so sánh 6 mô hình ----
  sectionHeading("3.3. Kết quả so sánh sáu mô hình"),
  body("Sáu mô hình học máy được huấn luyện và đánh giá trên cùng một tập kiểm thử 4.000 mẫu. Kết quả được thể hiện trong Bảng 3.1."),
  body("Bảng 3.1. Kết quả so sánh hiệu suất sáu mô hình phân loại"),

  new Table({
    width: { size: 9240, type: WidthType.DXA },
    columnWidths: [1600, 950, 950, 1100, 900, 900, 1050, 790],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcHeader("Mô hình"),
          tcHeader("Acc (%)"),
          tcHeader("F1"),
          tcHeader("ROC-AUC"),
          tcHeader("FPR (%)"),
          tcHeader("FNR (%)"),
          tcHeader("Train time"),
          tcHeader("Latency (ms)"),
        ],
      }),
      ...[
        ["Logistic Regression", "99,25", "0,9925", "0,9975", "0,15", "1,35", "< 1 s",  "0,000"],
        ["Random Forest",       "99,15", "0,9915", "0,9957", "0,50", "1,20", "~10 s",  "0,007"],
        ["XGBoost",             "99,51", "0,9952", "0,9968", "0,05", "0,90", "~15 s",  "0,002"],
        ["LightGBM",            "99,15", "0,9915", "0,9958", "0,30", "1,40", "~5 s",   "0,003"],
        ["Decision Tree",       "99,20", "0,9920", "0,9965", "0,20", "1,40", "< 1 s",  "0,000"],
        ["SVM",                 "99,32", "0,9932", "0,9935", "0,05", "1,30", "~120 s", "0,065"],
      ].map(row => new TableRow({
        children: row.map((cell, i) => tcData(cell, i > 0)),
      })),
    ],
  }),

  body("Nhận xét chung: Tất cả sáu mô hình đều đạt độ chính xác trên 99%, vượt xa mục tiêu 80% đặt ra trong đề cương. Điều này khẳng định rằng 30 đặc trưng ngữ vựng được lựa chọn có giá trị phân biệt rất cao giữa URL lừa đảo và URL hợp lệ."),
  body("SVM đạt F1-Score cao nhất là 0,9932 và FPR thấp nhất là 0,05%, tuy nhiên thời gian huấn luyện rất dài khoảng 120 giây và không hỗ trợ xuất sang định dạng JSON để triển khai phía client bằng JavaScript thuần. XGBoost đứng thứ hai về F1 với 0,9930 và FPR là 0,10%, đồng thời hỗ trợ xuất toàn bộ cấu trúc sang JSON với kích thước chỉ 468 KB. Đây là lý do XGBoost được chọn để triển khai trong tiện ích mở rộng Chrome."),
  body("Đáng chú ý là Logistic Regression đạt ROC-AUC cao nhất là 0,9975, cho thấy khả năng phân tách tổng quát tốt nhất ở mọi ngưỡng phân loại. Tuy nhiên do mô hình tuyến tính không nắm bắt được tương tác phi tuyến giữa các đặc trưng nên F1 và FPR kém hơn XGBoost."),

  // ---- 3.4 Phân tích tầm quan trọng đặc trưng ----
  sectionHeading("3.4. Phân tích tầm quan trọng đặc trưng"),
  body("XGBoost cung cấp chỉ số feature importance dựa trên mức độ đóng góp của mỗi đặc trưng vào việc giảm sai số trên toàn bộ 200 cây quyết định. Hình 3.1 thể hiện 15 đặc trưng quan trọng nhất."),
  body("[Hình 3.1. Biểu đồ tầm quan trọng đặc trưng, xem file: code/data/feature_importance.png]"),
  body("Ba đặc trưng quan trọng hàng đầu là url_length (độ dài URL), url_entropy (entropy Shannon toàn URL) và num_dots (số lượng dấu chấm). Kết quả này phù hợp với đặc điểm URL lừa đảo thực tế: các URL phishing thường rất dài do chứa nhiều tham số giả mạo, có entropy cao do chứa chuỗi ký tự ngẫu nhiên, và chứa nhiều dấu chấm để giả lập tên miền hợp lệ."),
  body("Đặc trưng has_https xếp ở vị trí thấp, cho thấy sự hiện diện của giao thức HTTPS không giúp phân biệt URL lừa đảo. Đây là kết quả quan trọng trong bối cảnh nhiều trang phishing hiện đại sử dụng chứng chỉ SSL miễn phí từ Let's Encrypt để tạo cảm giác an toàn giả tạo cho người dùng."),

  // ---- 3.5 Tối ưu hóa siêu tham số ----
  sectionHeading("3.5. Tối ưu hóa siêu tham số XGBoost"),

  subHeading("3.5.1. Thiết lập tìm kiếm"),
  body("Quá trình tối ưu sử dụng RandomizedSearchCV với 30 lần thử ngẫu nhiên trên không gian 9 siêu tham số, kết hợp kiểm định chéo 5 lần và tối ưu theo chỉ số F1. Tổng cộng 150 lần huấn luyện được thực hiện để tìm bộ tham số tốt nhất. Không gian tìm kiếm bao gồm số lượng cây từ 100 đến 400, độ sâu từ 4 đến 8, tốc độ học từ 0,01 đến 0,2, cùng các tham số điều chỉnh L1, L2 và tỷ lệ lấy mẫu đặc trưng."),

  subHeading("3.5.2. Bộ siêu tham số tối ưu"),
  body("Bộ tham số tốt nhất tìm được: subsample = 0,7; reg_lambda = 1; reg_alpha = 1; n_estimators = 300; min_child_weight = 1; max_depth = 5; learning_rate = 0,01; gamma = 0,3; colsample_bytree = 0,6. F1-Score trung bình trên kiểm định chéo 5 lần đạt 0,9936."),
  body("Nhận xét về bộ tham số: Learning_rate rất thấp (0,01) kết hợp số cây nhiều hơn (300 so với mặc định 200) theo nguyên tắc học chậm nhưng chắc, giúp mô hình tổng quát hóa tốt hơn. Gamma = 0,3 yêu cầu cải thiện đáng kể trước khi tách nút, kết hợp reg_alpha = 1 tạo ra hiệu ứng điều chỉnh L1 mạnh giúp loại bỏ các đặc trưng ít quan trọng."),

  subHeading("3.5.3. So sánh trước và sau tối ưu"),
  body("Bảng 3.2. So sánh XGBoost mặc định và XGBoost sau tối ưu"),
  new Table({
    width: { size: 9240, type: WidthType.DXA },
    columnWidths: [2200, 1760, 1760, 1760, 1760],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          tcHeader("Chỉ số"),
          tcHeader("XGBoost mặc định"),
          tcHeader("XGBoost (tuned)"),
          tcHeader("Thay đổi"),
          tcHeader("Ý nghĩa"),
        ],
      }),
      ...[
        ["F1-Score",    "0,9930", "0,9952", "+0,0022 ↑", "Tốt hơn đáng kể"],
        ["ROC-AUC",    "0,9972", "0,9968", "−0,0004",   "Gần như không đổi"],
        ["FPR",        "0,10%",  "0,05%",  "−0,05% ↓",  "Ít báo sai hơn"],
        ["FNR",        "1,30%",  "0,90%",  "−0,40% ↓",  "Ít bỏ sót hơn"],
        ["Model size", "468 KB", "402 KB", "−66 KB ↓",  "Nhỏ hơn cho Extension"],
        ["Latency",    "0,002ms","< 5ms",  "~",         "Vẫn đủ nhanh"],
      ].map(row => new TableRow({
        children: row.map((cell, i) => tcData(cell, i > 0)),
      })),
    ],
  }),
  body("Kết luận: Mô hình sau tối ưu có ROC-AUC cao hơn 0,0009 và kích thước nhỏ hơn 66 KB so với mô hình mặc định, trong khi F1-Score và FPR gần như không thay đổi. Đây là mô hình được chọn để xuất sang JSON và tích hợp vào tiện ích mở rộng Chrome."),

  // ---- 3.6 Chrome Extension ----
  sectionHeading("3.6. Kết quả triển khai Chrome Extension"),

  subHeading("3.6.1. Quá trình phát triển lặp đi lặp lại"),
  body("Tiện ích mở rộng được phát triển qua mười giai đoạn cải tiến liên tục, mỗi giai đoạn giải quyết một nhóm vấn đề cụ thể được phát hiện qua kiểm thử thực tế. Tiếp cận này đảm bảo mỗi vấn đề được phân tích nguyên nhân gốc rễ trước khi sửa, tránh tình trạng fix một vấn đề nhưng phát sinh vấn đề khác."),
  body("Giai đoạn 1 tập trung vào phát hiện giả mạo thương hiệu. Phiên bản ban đầu chỉ phát hiện 12/24 (50%) site giả mạo FitGirl do 12 site còn lại dùng TLD phổ thông (.com, .org) không kích hoạt quy tắc TLD đáng ngờ. Giải pháp: bổ sung BRANDS_CONFIG với 15 thương hiệu và thuật toán khoảng cách Levenshtein ngưỡng 3 để phát hiện typosquatting. Kết quả: 24/24 site bị chặn (100%)."),
  body("Giai đoạn 2 huấn luyện lại mô hình với tập dữ liệu mở rộng gồm 20.500 URL (thêm 500 URL giả mạo thương hiệu tổng hợp) và 38 đặc trưng, tăng F1 từ 0,9930 lên 0,9952. Giai đoạn này xác nhận rule-based layer quan trọng hơn ML cho bài toán giả mạo thương hiệu vì ML không thể học đủ mẫu từ 500 URL bổ sung."),
  body("Giai đoạn 3 chuyển feature extraction sang Full URL (có path, query) thay vì bare domain, tăng accuracy từ 81,9% lên 98,1% trên 105 URL kiểm thử toàn diện. Giai đoạn 4 xử lý ba edge case quan trọng: IP riêng tư không bị cảnh báo, tấn công homograph phát hiện qua regex kiểm tra ký tự Latin, URL bị mã hóa được giải mã tối đa 3 vòng."),
  body("Giai đoạn 5 triển khai hệ thống 3 bậc cảnh báo và danh sách Tranco Top 30.000. Giai đoạn 6 thêm tính năng Explainable AI, mỗi cảnh báo hiển thị lý do cụ thể thay vì chỉ hiển thị xác suất. Giai đoạn 7 mở rộng hỗ trợ tin cậy tự động: subdomain chính thức của brand, các nền tảng hosting uy tín như GitHub Pages và Vercel, và tên miền giáo dục .edu.vn do đây là nhóm tên miền được quản lý chặt chẽ bởi Bộ Thông tin và Truyền thông, ít có khả năng bị lạm dụng cho mục đích lừa đảo. Giai đoạn 8 tích hợp kiểm tra tuổi tên miền qua RDAP."),
  body("Giai đoạn 9 hoàn thiện trải nghiệm người dùng và bổ sung lớp danh sách đen. Tích hợp dangerous_url_checker.js với cơ sở dữ liệu 120+ URL nguy hiểm đã xác nhận, hỗ trợ khớp chính xác và khớp mẫu wildcard. Xây dựng giao diện popup chuyên nghiệp với dark theme gradient theo trạng thái, hiển thị URL, thanh xác suất phishing và lý do phát hiện. Triển khai icon động trên thanh công cụ bằng file PNG tĩnh (nhanh hơn Canvas API 10-20 lần) với bốn trạng thái: mặc định, an toàn, cảnh báo và nguy hiểm. Bổ sung hàm hasBrandImpersonation() trong content_analyzer.js để phát hiện giả mạo thương hiệu trực tiếp từ hostname mà không cần form mật khẩu, với điểm +0,6 là tín hiệu mạnh nhất trong phân tích DOM."),

  subHeading("3.6.2. Kết quả kiểm thử toàn diện (105 URL)"),
  body("Bộ kiểm thử toàn diện gồm 105 URL thuộc sáu nhóm đại diện, được thiết kế để bao phủ cả true positive và false positive. Kết quả được thể hiện trong Bảng 3.3."),
  body("Bảng 3.3. Kết quả kiểm thử toàn diện 105 URL trên Chrome Extension"),
  new Table({
    width: { size: 9240, type: WidthType.DXA },
    columnWidths: [3200, 1400, 1400, 3240],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [tcHeader("Nhóm URL"), tcHeader("Số lượng"), tcHeader("Kết quả"), tcHeader("Ghi chú")],
      }),
      ...[
        ["Domain chính thức (google.com, github.com, ...)", "19", "19/19 ✓", "Zero false positives"],
        ["Tranco Top 30K có path (google.com/search, ...)", "16", "16/16 ✓", "Không flag URL hợp lệ"],
        ["Site giả mạo FitGirl (fake .com/.org/.net)", "20", "20/20 ✓", "Tăng từ 50% → 100%"],
        ["Typosquatting thương hiệu (paypa1, goggle, ...)", "16", "16/16 ✓", "Levenshtein phát hiện"],
        ["Phishing với TLD đáng ngờ + từ khóa", "18", "18/18 ✓", "Rule-based 97%"],
        ["Edge case (IP riêng, homograph, encoding)", "16", "16/16 ✓", "Ba kỹ thuật né tránh"],
        ["TỔNG", "105", "105/105 (100%)", "Hoàn hảo"],
      ].map(row => new TableRow({
        children: row.map((cell, i) => tcData(cell, i > 0)),
      })),
    ],
  }),

  subHeading("3.6.3. Hiệu năng triển khai"),
  body("Bảng 3.4. Hiệu năng tiện ích mở rộng đo trên Brave 1.88 (Chromium 146), Windows 11"),
  new Table({
    width: { size: 9240, type: WidthType.DXA },
    columnWidths: [3500, 2800, 2940],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [tcHeader("Chỉ số"), tcHeader("Kết quả đo"), tcHeader("Mục tiêu đề cương")],
      }),
      ...[
        ["Độ trễ ML (trích xuất + suy luận)", "< 5 ms", "< 200 ms ✓"],
        ["Độ trễ phân tích DOM", "< 10 ms", "Không yêu cầu"],
        ["Tổng kích thước tiện ích mở rộng", "~920 KB", "< 1 MB ✓"],
        ["Trong đó: model JSON (38 đặc trưng)", "402 KB", ""],
        ["Trong đó: Tranco Top 30K whitelist", "442 KB", ""],
        ["Trong đó: Blacklist + Icons + Popup", "~76 KB", ""],
        ["Hoạt động offline hoàn toàn", "Có", "Yêu cầu ✓"],
        ["Gửi dữ liệu người dùng ra ngoài", "Không", "Yêu cầu ✓"],
      ].map(row => new TableRow({
        children: row.map((cell, i) => tcData(cell, i > 0)),
      })),
    ],
  }),

  // ================================================================
  // CHƯƠNG 4 — KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
  // ================================================================
  chapterHeading("Chương 4. Kết luận và hướng phát triển"),

  sectionHeading("4.1. Kết luận"),
  body("Đề tài đã xây dựng thành công hệ thống phát hiện URL lừa đảo theo kiến trúc phòng thủ 8 lớp, tích hợp bốn phương pháp bổ sung cho nhau: danh sách đen, danh sách tin cậy, quy tắc heuristic dựa trên thương hiệu và học máy. Pipeline bao gồm thu thập 20.500 URL từ PhishTank và Tranco, trích xuất 38 đặc trưng ngữ vựng, huấn luyện sáu mô hình phân loại, và triển khai XGBoost được tối ưu trong tiện ích mở rộng Chrome theo chuẩn Manifest V3."),
  body("XGBoost sau tối ưu hóa đạt F1-Score 0,9952, tỷ lệ báo động giả 0,05% và tỷ lệ bỏ sót 0,90% trên tập kiểm thử 4.100 URL. Kiểm thử thực tế trên Chrome với bộ 105 URL toàn diện đạt tỷ lệ chính xác 100%, bao gồm zero false positives trên 35 trang chính thống và 100% phát hiện trên 36 URL giả mạo thương hiệu. Thuật toán khoảng cách Levenshtein giúp phát hiện typosquatting như paypa1.com hay goggle.com mà mô hình ML thuần không xử lý được. Kiểm tra tuổi tên miền qua RDAP cung cấp thêm lớp thông tin tin cậy không cần API key. Danh sách đen 120+ URL nguy hiểm bổ sung khả năng chặn tức thì các trang đã xác nhận. Giao diện popup dark theme và icon động trên thanh công cụ nâng cao trải nghiệm người dùng. Toàn bộ hệ thống hoạt động offline 100%, kích thước dưới 1 MB và độ trễ dưới 50ms."),

  sectionHeading("4.2. Hạn chế"),
  body("BRANDS_CONFIG cần bổ sung thủ công khi có thương hiệu mới. Hiện tại cấu hình 15 thương hiệu, trong khi thực tế có hàng nghìn thương hiệu bị giả mạo. Tự động hóa khám phá thương hiệu từ Tranco và phản hồi người dùng là hướng cải tiến tiếp theo."),
  body("RDAP domain age checking có độ trễ tối đa 5 giây và không hỗ trợ toàn bộ TLD. Kết quả chỉ được hiển thị như thông tin bổ sung trên banner mà không ảnh hưởng đến quyết định block hay safe, hạn chế giá trị thực tiễn của tính năng này."),
  body("Danh sách đen hiện tại chỉ chứa 120+ URL được cập nhật thủ công. Với các trang phishing mới xuất hiện nhưng chưa có trong danh sách, hệ thống chỉ có thể phát hiện qua phân tích DOM khi trang đã tải xong. Cần xây dựng cơ chế cập nhật danh sách đen tự động từ các nguồn cộng đồng."),
  body("Tập dữ liệu huấn luyện lấy từ thời điểm cụ thể năm 2024. Chiến thuật phishing thay đổi liên tục và mô hình có thể giảm độ chính xác theo thời gian nếu không được cập nhật định kỳ."),

  sectionHeading("4.3. Hướng phát triển"),
  body("Nâng cấp danh sách đen từ tĩnh sang động bằng cách tích hợp nguồn cập nhật tự động từ PhishTank, OpenPhish và URLhaus, đồng bộ định kỳ mỗi 24 giờ qua Firebase hoặc cơ chế Service Worker background sync mà không cần người dùng cập nhật tiện ích mở rộng."),
  body("Xây dựng cơ chế thu thập phản hồi: khi người dùng nhấn nút Báo cáo an toàn, gửi URL về hệ thống backend để thu thập false positive và false negative. Dữ liệu phản hồi được dùng để huấn luyện lại mô hình định kỳ mỗi tháng, giúp mô hình thích nghi với các chiến thuật phishing mới."),
  body("Phát hiện logo thương hiệu bằng Computer Vision: sử dụng TensorFlow.js nhẹ để so sánh favicon và hình ảnh nổi bật trên trang với cơ sở dữ liệu logo thương hiệu, phát hiện trang phishing giả mạo giao diện mà không giả mạo trong chuỗi URL."),
  body("Mở rộng hỗ trợ sang trình duyệt Firefox và Edge: kiến trúc Manifest V3 tương thích với chuẩn WebExtensions nên việc port sang các trình duyệt khác có thể thực hiện với thay đổi tối thiểu, mở rộng phạm vi bảo vệ người dùng."),

  // ---- TÀI LIỆU THAM KHẢO ----
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: "TÀI LIỆU THAM KHẢO", font: TNR, size: HEADING_CH, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: makeSpacing(0, 240),
    pageBreakBefore: true,
  }),
  ...[
    "[1] Le Page, A., & Komisarczuk, P. (2014). An Analysis of Phishing Blacklists: Google Safe Browsing, OpenPhish, and PhishTank. Proceedings of the Australasian Information Security Conference.",
    "[2] Mohammad, R. M., Thabtah, F., & McCluskey, L. (2014). Predicting Phishing Websites based on Self-Structuring Neural Network. Neural Computing and Applications.",
    "[3] Sahingoz, O. K., et al. (2019). Machine learning based phishing detection from URLs. Expert Systems with Applications, 117, 345-357.",
    "[4] Zouina, M., & Outtaj, B. (2017). A novel lightweight URL phishing detection system using SVM and similarity index. Human-centric Computing and Information Sciences.",
    "[5] IBM Security. (2024). IBM X-Force Threat Intelligence Index 2024. IBM Corporation.",
    "[6] OpenPhish. (2024). OpenPhish – Phishing Intelligence. Truy cập tại: https://openphish.com",
    "[7] PhishTank. (2024). PhishTank – Join the fight against phishing. Truy cập tại: https://www.phishtank.com",
    "[8] Verma, R., et al. (2024). Phishing URL Detection Using Machine Learning: A Survey. IEEE Access.",
  ].map(ref => new Paragraph({
    children: [new TextRun({ text: ref, font: TNR, size: BODY_SIZE })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: makeSpacing(0, 120),
    indent: { hanging: 360 },
  })),
];

// ============================================================
// BUILD DOCUMENT
// ============================================================
const doc = new Document({
  features: { updateFields: true },
  styles: {
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        run: { color: "000000", font: TNR },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        run: { color: "000000", font: TNR },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        run: { color: "000000", font: TNR },
      },
    ],
    characterStyles: [{
      id: "Hyperlink",
      name: "Hyperlink",
      run: {
        color: "000000",
        underline: {},
      },
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: {
          top: 1134,    // 2 cm
          bottom: 1418, // 2.5 cm
          left: 1701,   // 3 cm
          right: 1134,  // 2 cm
        },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [new TextRun({ children: [PageNumber.CURRENT], font: TNR, size: BODY_SIZE })],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:/Users/BDTG/Desktop/Đồ Án Cơ Sở/Báo cáo/BaoCao_DACS_TranDuyThai_v9.docx", buffer);
  console.log("Done! v9 saved.");
});
