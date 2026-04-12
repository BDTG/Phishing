// generate_slides.js — Slide thuyết trình DACS
// Phishing URL Detector — Chrome Extension with XGBoost ML
// Sinh viên: Trần Duy Thái — MSSV 2387700060

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3" x 7.5" — rộng, hiện đại
pres.author = "Tran Duy Thai";
pres.title = "Phishing URL Detector — DACS";
pres.company = "HUTECH University";

// ============================================================
// THEME — Ocean Gradient + Cyber accent
// ============================================================
const C = {
  bgDark: "0A1929",       // nền tối chính
  bgMid: "132F4C",        // nền tối phụ
  bgLight: "F5F7FA",      // nền sáng cho content slide
  primary: "065A82",      // deep blue
  secondary: "1C7293",    // teal
  accent: "00D4FF",       // cyan sáng — accent nổi bật
  accentWarm: "FF6B35",   // cam — cho warning/số liệu
  textDark: "0A1929",
  textMid: "3E5266",
  textMuted: "8A9BA8",
  textLight: "F5F7FA",
  success: "22C55E",
  warning: "F59E0B",
  danger: "EF4444",
};

const FONT_HEAD = "Calibri";
const FONT_BODY = "Calibri";

// ============================================================
// HELPERS
// ============================================================
function addFooter(slide, pageNum, total) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 7.15, w: 13.3, h: 0.35,
    fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 7.15, w: 13.3, h: 0.04,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  slide.addText("Phishing URL Detector — DACS 2026", {
    x: 0.5, y: 7.18, w: 8, h: 0.32,
    fontSize: 9, fontFace: FONT_BODY, color: C.textLight, margin: 0,
  });
  slide.addText(`Trần Duy Thái — 2387700060   |   ${pageNum}/${total}`, {
    x: 8.5, y: 7.18, w: 4.3, h: 0.32,
    fontSize: 9, fontFace: FONT_BODY, color: C.textLight, align: "right", margin: 0,
  });
}

function addSlideTitle(slide, title, subtitle) {
  // Accent bar (left, not underline — underline is AI-slop)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.5, w: 0.08, h: 0.85,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  slide.addText(title, {
    x: 0.75, y: 0.45, w: 12, h: 0.6,
    fontSize: 30, fontFace: FONT_HEAD, bold: true, color: C.textDark, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.75, y: 1.0, w: 12, h: 0.35,
      fontSize: 14, fontFace: FONT_BODY, italic: true, color: C.textMuted, margin: 0,
    });
  }
}

// ============================================================
// SLIDE 1 — TITLE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgDark };

  // Decorative circuit lines (subtle)
  s.addShape(pres.shapes.LINE, {
    x: 0, y: 1.5, w: 13.3, h: 0,
    line: { color: C.accent, width: 1, transparency: 70 },
  });
  s.addShape(pres.shapes.LINE, {
    x: 0, y: 6.0, w: 13.3, h: 0,
    line: { color: C.accent, width: 1, transparency: 70 },
  });

  // Big shield icon text
  s.addText("🛡", {
    x: 0.5, y: 1.8, w: 2.5, h: 2.5,
    fontSize: 140, color: C.accent, align: "center", valign: "middle", margin: 0,
  });

  // Project label
  s.addText("ĐỒ ÁN CƠ SỞ — DACS 2026", {
    x: 3.2, y: 1.9, w: 9.5, h: 0.4,
    fontSize: 14, fontFace: FONT_BODY, bold: true, color: C.accent,
    charSpacing: 4, margin: 0,
  });

  // Title
  s.addText("PHISHING URL DETECTOR", {
    x: 3.2, y: 2.4, w: 9.5, h: 0.9,
    fontSize: 44, fontFace: FONT_HEAD, bold: true, color: C.textLight, margin: 0,
  });
  s.addText("Chrome Extension phát hiện URL lừa đảo", {
    x: 3.2, y: 3.25, w: 9.5, h: 0.5,
    fontSize: 22, fontFace: FONT_BODY, color: "B3D4E8", margin: 0,
  });
  s.addText("bằng Machine Learning (XGBoost)", {
    x: 3.2, y: 3.65, w: 9.5, h: 0.5,
    fontSize: 22, fontFace: FONT_BODY, color: "B3D4E8", margin: 0,
  });

  // Divider line
  s.addShape(pres.shapes.LINE, {
    x: 3.2, y: 4.4, w: 3, h: 0,
    line: { color: C.accent, width: 2 },
  });

  // Author info
  s.addText([
    { text: "Sinh viên thực hiện:   ", options: { color: C.textMuted, fontSize: 14 } },
    { text: "Trần Duy Thái", options: { color: C.textLight, fontSize: 16, bold: true, breakLine: true } },
    { text: "MSSV:                           ", options: { color: C.textMuted, fontSize: 14 } },
    { text: "2387700060", options: { color: C.textLight, fontSize: 16, bold: true, breakLine: true } },
    { text: "Giảng viên hướng dẫn: ", options: { color: C.textMuted, fontSize: 14 } },
    { text: "Tue Huynh", options: { color: C.textLight, fontSize: 16, bold: true, breakLine: true } },
    { text: "Trường:                        ", options: { color: C.textMuted, fontSize: 14 } },
    { text: "Đại học HUTECH", options: { color: C.textLight, fontSize: 16, bold: true } },
  ], {
    x: 3.2, y: 4.6, w: 9.5, h: 2, fontFace: FONT_BODY, margin: 0,
  });

  // Date
  s.addText("Tháng 4, 2026", {
    x: 0.5, y: 6.3, w: 12.3, h: 0.35,
    fontSize: 12, fontFace: FONT_BODY, italic: true, color: C.textMuted, align: "center", margin: 0,
  });
}

// ============================================================
// SLIDE 2 — PROBLEM / MOTIVATION
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Vấn đề: Phishing là mối đe dọa nghiêm trọng", "Tại sao cần phát hiện URL lừa đảo ngay trong trình duyệt?");

  // 3 stat callouts
  const stats = [
    { num: "3.4 tỷ", label: "email phishing gửi mỗi ngày trên toàn cầu", color: C.primary },
    { num: "> 83%", label: "các vụ tấn công mạng khởi đầu bằng phishing", color: C.secondary },
    { num: "17.7 tỷ $", label: "thiệt hại toàn cầu do phishing năm 2023 (FBI IC3)", color: C.accentWarm },
  ];

  stats.forEach((stat, i) => {
    const x = 0.75 + i * 4.2;
    // Card
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.8, w: 3.9, h: 2.4,
      fill: { color: "FFFFFF" },
      line: { color: "E2E8F0", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 12, offset: 3, angle: 90, opacity: 0.08 },
    });
    // Left color bar
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.8, w: 0.1, h: 2.4,
      fill: { color: stat.color }, line: { color: stat.color, width: 0 },
    });
    // Number
    s.addText(stat.num, {
      x: x + 0.3, y: 2.0, w: 3.5, h: 1.0,
      fontSize: 48, fontFace: FONT_HEAD, bold: true, color: stat.color, margin: 0,
    });
    // Label
    s.addText(stat.label, {
      x: x + 0.3, y: 3.1, w: 3.5, h: 1.0,
      fontSize: 14, fontFace: FONT_BODY, color: C.textMid, margin: 0,
    });
  });

  // Bottom call-out
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.75, y: 4.6, w: 11.8, h: 2.2,
    fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.75, y: 4.6, w: 0.1, h: 2.2,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  s.addText("KHOẢNG TRỐNG BẢO VỆ HIỆN TẠI", {
    x: 1.0, y: 4.75, w: 11.5, h: 0.35,
    fontSize: 12, fontFace: FONT_BODY, bold: true, color: C.accent, charSpacing: 3, margin: 0,
  });
  s.addText([
    { text: "Google Safe Browsing", options: { bold: true, color: C.textLight } },
    { text: " có độ trễ cập nhật (vài giờ → vài ngày cho site mới). Các công cụ bảo mật thương mại yêu cầu ", options: { color: "B3D4E8" } },
    { text: "gửi URL lên server", options: { bold: true, color: C.accent } },
    { text: " → lộ lịch sử duyệt web. Người dùng cá nhân cần một lớp bảo vệ ", options: { color: "B3D4E8" } },
    { text: "chạy offline, realtime, và tôn trọng quyền riêng tư.", options: { bold: true, color: C.textLight } },
  ], {
    x: 1.0, y: 5.15, w: 11.5, h: 1.6,
    fontSize: 16, fontFace: FONT_BODY, margin: 0,
  });

  addFooter(s, 2, 14);
}

// ============================================================
// SLIDE 3 — OBJECTIVES
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Mục tiêu đồ án", "5 mục tiêu cốt lõi cần đạt được");

  const objectives = [
    { num: "01", title: "Chrome Extension hoàn chỉnh", desc: "Manifest V3, cài đặt và sử dụng được trên Chrome/Edge/Brave" },
    { num: "02", title: "Model XGBoost chạy offline", desc: "Train trên ~100K URL, xuất sang JSON chạy trực tiếp trong browser" },
    { num: "03", title: "Kiến trúc phòng thủ nhiều lớp", desc: "Kết hợp whitelist, blacklist, rules, ML và phân tích DOM" },
    { num: "04", title: "Bảo vệ quyền riêng tư", desc: "Không gửi URL người dùng lên server bên thứ ba" },
    { num: "05", title: "UI/UX thân thiện", desc: "Popup trực quan, options page tùy chỉnh, banner cảnh báo rõ ràng" },
  ];

  objectives.forEach((obj, i) => {
    const y = 1.7 + i * 1.02;
    // Number circle
    s.addShape(pres.shapes.OVAL, {
      x: 0.75, y, w: 0.85, h: 0.85,
      fill: { color: C.primary }, line: { color: C.accent, width: 2 },
    });
    s.addText(obj.num, {
      x: 0.75, y, w: 0.85, h: 0.85,
      fontSize: 18, fontFace: FONT_HEAD, bold: true, color: C.textLight,
      align: "center", valign: "middle", margin: 0,
    });
    // Title
    s.addText(obj.title, {
      x: 1.85, y: y + 0.02, w: 10.5, h: 0.4,
      fontSize: 18, fontFace: FONT_HEAD, bold: true, color: C.textDark, margin: 0,
    });
    // Description
    s.addText(obj.desc, {
      x: 1.85, y: y + 0.45, w: 10.5, h: 0.4,
      fontSize: 13, fontFace: FONT_BODY, color: C.textMid, margin: 0,
    });
  });

  addFooter(s, 3, 14);
}

// ============================================================
// SLIDE 4 — SOLUTION OVERVIEW
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Giải pháp tổng quan", "Chrome Extension + XGBoost ML chạy hoàn toàn offline");

  // Flow diagram: User → URL → Extension → Verdict
  const steps = [
    { label: "Người dùng\ntruy cập URL", icon: "👤", color: C.textMid },
    { label: "Content Script\nphân tích URL", icon: "🔍", color: C.primary },
    { label: "8 lớp\nphòng thủ", icon: "🛡", color: C.secondary },
    { label: "Verdict\n3-Tier", icon: "⚖", color: C.accentWarm },
    { label: "Banner +\nIcon toolbar", icon: "🔔", color: C.danger },
  ];

  steps.forEach((step, i) => {
    const x = 0.5 + i * 2.6;
    // Card
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.9, w: 2.3, h: 2.2,
      fill: { color: "FFFFFF" }, line: { color: step.color, width: 2 },
      shadow: { type: "outer", color: "000000", blur: 10, offset: 2, angle: 90, opacity: 0.08 },
    });
    // Icon
    s.addText(step.icon, {
      x, y: 2.0, w: 2.3, h: 1.0,
      fontSize: 48, align: "center", valign: "middle", margin: 0,
    });
    // Label
    s.addText(step.label, {
      x, y: 3.0, w: 2.3, h: 1.0,
      fontSize: 13, fontFace: FONT_BODY, bold: true, color: step.color,
      align: "center", valign: "middle", margin: 0,
    });
    // Arrow between cards
    if (i < steps.length - 1) {
      s.addText("▶", {
        x: x + 2.3, y: 2.6, w: 0.3, h: 0.8,
        fontSize: 20, color: C.accent, align: "center", valign: "middle", margin: 0,
      });
    }
  });

  // Key features row
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.75, y: 4.6, w: 11.8, h: 2.2,
    fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
  });

  const features = [
    { title: "Offline", desc: "Model chạy trong browser, <5ms/URL" },
    { title: "Privacy-first", desc: "Không gửi URL ra server ngoài" },
    { title: "Manifest V3", desc: "Tương thích Chrome mới nhất" },
    { title: "Tùy chỉnh", desc: "Sensitivity, blocklist, whitelist" },
  ];

  features.forEach((f, i) => {
    const x = 0.9 + i * 2.95;
    s.addText("✓", {
      x, y: 4.8, w: 0.4, h: 0.5,
      fontSize: 22, bold: true, color: C.accent, margin: 0,
    });
    s.addText(f.title, {
      x: x + 0.4, y: 4.8, w: 2.5, h: 0.4,
      fontSize: 16, fontFace: FONT_HEAD, bold: true, color: C.textDark, margin: 0,
    });
    s.addText(f.desc, {
      x: x + 0.4, y: 5.2, w: 2.5, h: 1.5,
      fontSize: 12, fontFace: FONT_BODY, color: C.textMid, margin: 0,
    });
  });

  addFooter(s, 4, 14);
}

// ============================================================
// SLIDE 5 — 8-LAYER DEFENSE ARCHITECTURE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Kiến trúc 8 lớp phòng thủ", "Multi-layer defense — mỗi lớp bắt một loại threat khác nhau");

  const layers = [
    { n: "0",  name: "IP/Localhost Detection",    desc: "Bỏ qua mạng nội bộ",           color: C.textMuted },
    { n: "0b", name: "Homograph / IDN Attack",    desc: "Chặn ký tự Cyrillic giả mạo",  color: "9333EA" },
    { n: "1",  name: "Whitelist (Safe Domains)",  desc: "Google, GitHub, HUTECH…",      color: C.success },
    { n: "1c", name: "Tranco Top 30K",            desc: "30K site uy tín — zero FP",    color: C.success },
    { n: "2",  name: "Brand Impersonation",       desc: "Levenshtein + typosquatting",  color: C.accentWarm },
    { n: "3a", name: "Suspicious TLD Rules",      desc: ".tk, .xyz, .gq + keyword",     color: C.warning },
    { n: "3c", name: "XGBoost ML Model",          desc: "38 features, 300 trees",       color: C.primary },
    { n: "4",  name: "DOM + RDAP Age Check",      desc: "Phân tích HTML + tuổi domain", color: C.secondary },
  ];

  // 2 columns x 4 rows
  layers.forEach((layer, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.75 + col * 6.2;
    const y = 1.7 + row * 1.3;

    // Card
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 5.9, h: 1.15,
      fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.06 },
    });
    // Left color accent
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.1, h: 1.15,
      fill: { color: layer.color }, line: { color: layer.color, width: 0 },
    });
    // Layer number
    s.addText(`LỚP ${layer.n}`, {
      x: x + 0.25, y: y + 0.1, w: 1.1, h: 0.35,
      fontSize: 11, fontFace: FONT_BODY, bold: true, color: layer.color,
      charSpacing: 2, margin: 0,
    });
    // Name
    s.addText(layer.name, {
      x: x + 0.25, y: y + 0.38, w: 5.5, h: 0.4,
      fontSize: 16, fontFace: FONT_HEAD, bold: true, color: C.textDark, margin: 0,
    });
    // Desc
    s.addText(layer.desc, {
      x: x + 0.25, y: y + 0.75, w: 5.5, h: 0.35,
      fontSize: 12, fontFace: FONT_BODY, color: C.textMid, margin: 0,
    });
  });

  // Bottom note
  s.addText("💡 Mỗi URL đi qua tuần tự các lớp — bị chặn ở lớp nào thì dừng ở đó, không đi xuống lớp dưới.", {
    x: 0.75, y: 6.95, w: 11.8, h: 0.3,
    fontSize: 12, fontFace: FONT_BODY, italic: true, color: C.textMuted, margin: 0,
  });

  addFooter(s, 5, 14);
}

// ============================================================
// SLIDE 6 — WHY XGBOOST
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Tại sao chọn XGBoost?", "So sánh với các lựa chọn ML khác cho bài toán này");

  // Comparison table
  const rows = [
    ["", "XGBoost", "Deep Learning", "Logistic\nRegression"],
    ["Độ chính xác", "★★★★★", "★★★★★", "★★★"],
    ["Tốc độ inference", "★★★★★ (<5ms)", "★★ (50-200ms)", "★★★★★"],
    ["Kích thước model", "★★★★ (402 KB)", "★ (50-500 MB)", "★★★★★ (<100 KB)"],
    ["Chạy được trong browser", "✓", "✗ (quá lớn)", "✓"],
    ["Dễ giải thích", "★★★★", "★ (black box)", "★★★★★"],
    ["Robust với outlier", "★★★★★", "★★★", "★★"],
  ];

  const tableData = rows.map((row, ri) => {
    return row.map((cell, ci) => {
      if (ri === 0) {
        return {
          text: cell,
          options: {
            bold: true, color: C.textLight, fill: { color: C.primary },
            align: "center", fontSize: 13, fontFace: FONT_HEAD,
          },
        };
      }
      if (ci === 1) {
        return {
          text: cell,
          options: {
            bold: true, color: C.primary, fill: { color: "E3F2FD" },
            align: "center", fontSize: 12, fontFace: FONT_BODY,
          },
        };
      }
      return {
        text: cell,
        options: {
          color: C.textMid, align: "center", fontSize: 12, fontFace: FONT_BODY,
          fill: { color: ri % 2 === 0 ? "F8FAFC" : "FFFFFF" },
        },
      };
    });
  });

  s.addTable(tableData, {
    x: 0.75, y: 1.7, w: 9.5,
    colW: [2.8, 2.3, 2.3, 2.1],
    rowH: 0.5,
    border: { pt: 0.5, color: "E2E8F0" },
  });

  // Right callout: "Kết luận"
  s.addShape(pres.shapes.RECTANGLE, {
    x: 10.5, y: 1.7, w: 2.3, h: 5.0,
    fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 10.5, y: 1.7, w: 2.3, h: 0.08,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  s.addText("KẾT LUẬN", {
    x: 10.6, y: 1.9, w: 2.1, h: 0.35,
    fontSize: 11, fontFace: FONT_BODY, bold: true, color: C.accent,
    charSpacing: 2, margin: 0,
  });
  s.addText("XGBoost", {
    x: 10.6, y: 2.3, w: 2.1, h: 0.5,
    fontSize: 22, fontFace: FONT_HEAD, bold: true, color: C.textLight, margin: 0,
  });
  s.addText("là điểm cân bằng tốt nhất giữa:", {
    x: 10.6, y: 2.85, w: 2.1, h: 0.5,
    fontSize: 11, fontFace: FONT_BODY, color: "B3D4E8", margin: 0,
  });
  s.addText([
    { text: "✓ Chính xác cao", options: { color: C.accent, breakLine: true, bold: true } },
    { text: "✓ Nhẹ để chạy\n    trong browser", options: { color: C.accent, breakLine: true, bold: true } },
    { text: "✓ Giải thích được", options: { color: C.accent, breakLine: true, bold: true } },
    { text: "✓ Training nhanh", options: { color: C.accent, bold: true } },
  ], {
    x: 10.6, y: 3.4, w: 2.1, h: 3.0,
    fontSize: 12, fontFace: FONT_BODY, margin: 0,
  });

  addFooter(s, 6, 14);
}

// ============================================================
// SLIDE 7 — 38 FEATURES
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "38 đặc trưng trích xuất từ URL", "Biến URL (string) thành vector số để XGBoost học");

  const groups = [
    { title: "Length", count: 7, desc: "url_length, hostname_length, path_length, num_dots, num_slashes…", color: C.primary },
    { title: "Character", count: 9, desc: "num_digits, has_@, has_-, has_%, num_params…",                   color: C.secondary },
    { title: "Keyword",   count: 6, desc: "has_login, has_verify, has_secure, has_account, has_banking…",   color: C.accentWarm },
    { title: "TLD",       count: 4, desc: "is_suspicious_tld, is_country_tld, tld_length…",                 color: C.warning },
    { title: "Hostname",  count: 6, desc: "num_subdomains, has_ip, has_port, is_idn, subdomain_depth…",     color: "9333EA" },
    { title: "Entropy",   count: 3, desc: "hostname_entropy (Shannon), path_entropy, query_entropy",         color: C.success },
    { title: "Ratio",     count: 3, desc: "digit_ratio, special_char_ratio, vowel_ratio",                    color: C.danger },
  ];

  // Left: 7 group cards in 2 columns
  groups.forEach((g, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.75 + col * 4.0;
    const y = 1.75 + row * 1.3;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 3.8, h: 1.15,
      fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.06 },
    });
    // Count badge
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.15, y: y + 0.2, w: 0.75, h: 0.75,
      fill: { color: g.color }, line: { color: g.color, width: 0 },
    });
    s.addText(String(g.count), {
      x: x + 0.15, y: y + 0.2, w: 0.75, h: 0.75,
      fontSize: 22, fontFace: FONT_HEAD, bold: true, color: C.textLight,
      align: "center", valign: "middle", margin: 0,
    });
    // Title
    s.addText(g.title, {
      x: x + 1.05, y: y + 0.15, w: 2.7, h: 0.35,
      fontSize: 15, fontFace: FONT_HEAD, bold: true, color: C.textDark, margin: 0,
    });
    // Desc
    s.addText(g.desc, {
      x: x + 1.05, y: y + 0.48, w: 2.7, h: 0.65,
      fontSize: 10, fontFace: FONT_BODY, color: C.textMid, margin: 0,
    });
  });

  // Right: Total stat
  s.addShape(pres.shapes.RECTANGLE, {
    x: 9.0, y: 1.75, w: 3.8, h: 5.2,
    fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 9.0, y: 1.75, w: 0.08, h: 5.2,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  s.addText("TỔNG CỘNG", {
    x: 9.25, y: 2.0, w: 3.5, h: 0.4,
    fontSize: 12, fontFace: FONT_BODY, bold: true, color: C.accent,
    charSpacing: 3, margin: 0,
  });
  s.addText("38", {
    x: 9.25, y: 2.45, w: 3.5, h: 1.6,
    fontSize: 110, fontFace: FONT_HEAD, bold: true, color: C.textLight, margin: 0,
  });
  s.addText("đặc trưng", {
    x: 9.25, y: 4.1, w: 3.5, h: 0.5,
    fontSize: 18, fontFace: FONT_BODY, color: "B3D4E8", margin: 0,
  });
  s.addText([
    { text: "Mỗi URL → vector 38 chiều → XGBoost traverse ", options: { color: "B3D4E8" } },
    { text: "300 cây", options: { color: C.accent, bold: true } },
    { text: " → probability", options: { color: "B3D4E8" } },
  ], {
    x: 9.25, y: 5.3, w: 3.5, h: 1.5,
    fontSize: 12, fontFace: FONT_BODY, margin: 0,
  });

  addFooter(s, 7, 14);
}

// ============================================================
// SLIDE 8 — DATASET NORMALIZATION
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Quy trình chuẩn hóa Dataset", "7 bước biến 115K URL thô → 100K dataset sạch");

  // Top: data sources
  const sources = [
    { name: "PhishTank",     count: "~30K", type: "Phishing", color: C.danger },
    { name: "OpenPhish",     count: "~15K", type: "Phishing", color: C.danger },
    { name: "Tranco Top 1M", count: "~50K", type: "Benign",   color: C.success },
    { name: "Common Crawl",  count: "~20K", type: "Benign",   color: C.success },
  ];

  sources.forEach((src, i) => {
    const x = 0.75 + i * 3.07;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.65, w: 2.85, h: 1.25,
      fill: { color: "FFFFFF" }, line: { color: src.color, width: 1.5 },
    });
    s.addText(src.name, {
      x: x + 0.1, y: 1.7, w: 2.65, h: 0.35,
      fontSize: 13, fontFace: FONT_HEAD, bold: true, color: C.textDark, margin: 0,
    });
    s.addText(src.count, {
      x: x + 0.1, y: 2.0, w: 2.65, h: 0.5,
      fontSize: 24, fontFace: FONT_HEAD, bold: true, color: src.color, margin: 0,
    });
    s.addText(src.type, {
      x: x + 0.1, y: 2.55, w: 2.65, h: 0.3,
      fontSize: 10, fontFace: FONT_BODY, color: C.textMid, margin: 0,
    });
  });

  // Arrow down
  s.addText("▼", {
    x: 6.15, y: 3.0, w: 1, h: 0.35,
    fontSize: 18, color: C.accent, align: "center", margin: 0,
  });

  // 7 steps as horizontal flow
  const steps = [
    { n: 1, t: "Dedupe",    d: "Exact +\nnormalized" },
    { n: 2, t: "Validate",  d: "Parse\ncheck" },
    { n: 3, t: "Format",    d: "Lowercase\nPunycode" },
    { n: 4, t: "Outlier",   d: "<10,\n>2048 chars" },
    { n: 5, t: "Balance",   d: "Undersample\nbenign" },
    { n: 6, t: "Features",  d: "Trích 38\nfeatures" },
    { n: 7, t: "Split",     d: "Train/Test\n80/20" },
  ];

  steps.forEach((st, i) => {
    const x = 0.75 + i * 1.78;
    // Circle
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.3, y: 3.55, w: 1.0, h: 1.0,
      fill: { color: C.primary }, line: { color: C.accent, width: 2 },
    });
    s.addText(String(st.n), {
      x: x + 0.3, y: 3.55, w: 1.0, h: 1.0,
      fontSize: 24, fontFace: FONT_HEAD, bold: true, color: C.textLight,
      align: "center", valign: "middle", margin: 0,
    });
    // Title
    s.addText(st.t, {
      x, y: 4.65, w: 1.6, h: 0.35,
      fontSize: 13, fontFace: FONT_HEAD, bold: true, color: C.textDark,
      align: "center", margin: 0,
    });
    // Desc
    s.addText(st.d, {
      x, y: 5.0, w: 1.6, h: 0.65,
      fontSize: 10, fontFace: FONT_BODY, color: C.textMid,
      align: "center", margin: 0,
    });
    // Arrow between steps
    if (i < steps.length - 1) {
      s.addText("→", {
        x: x + 1.3, y: 3.8, w: 0.5, h: 0.5,
        fontSize: 20, color: C.accent, bold: true, align: "center", valign: "middle", margin: 0,
      });
    }
  });

  // Output box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.75, y: 5.9, w: 11.8, h: 0.95,
    fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.75, y: 5.9, w: 0.1, h: 0.95,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  s.addText([
    { text: "Output:  ", options: { color: C.accent, bold: true, fontSize: 14 } },
    { text: "~100K URL sạch  |  ", options: { color: C.textLight, fontSize: 13 } },
    { text: "Tỉ lệ 45% phishing / 55% benign  |  ", options: { color: C.textLight, fontSize: 13 } },
    { text: "Label noise <2%  |  ", options: { color: C.textLight, fontSize: 13 } },
    { text: "Reproducible seed=42", options: { color: C.textLight, fontSize: 13 } },
  ], {
    x: 1.0, y: 6.1, w: 11.5, h: 0.6, fontFace: FONT_BODY, margin: 0,
  });

  addFooter(s, 8, 14);
}

// ============================================================
// SLIDE 9 — 3-TIER THRESHOLD SYSTEM
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Hệ thống 3-Tier Threshold", "Tránh alert fatigue — phân loại mức độ rủi ro rõ ràng");

  const tiers = [
    {
      name: "SAFE",
      range: "0.00 — 0.78",
      icon: "✓",
      color: C.success,
      lightBg: "DCFCE7",
      desc: "Không hiển thị cảnh báo. Icon toolbar màu xanh lá.",
      action: "Cho qua tự do",
    },
    {
      name: "WARNING",
      range: "0.78 — 0.85",
      icon: "⚠",
      color: C.warning,
      lightBg: "FEF3C7",
      desc: "Banner cam ở đỉnh trang. User có nút “Bỏ qua” và “Báo cáo an toàn”.",
      action: "Cảnh báo mềm",
    },
    {
      name: "BLOCK",
      range: "0.85 — 1.00",
      icon: "✕",
      color: C.danger,
      lightBg: "FEE2E2",
      desc: "Banner đỏ đậm, cảnh báo mạnh. Liệt kê đầy đủ lý do phát hiện.",
      action: "Cảnh báo nghiêm",
    },
  ];

  tiers.forEach((t, i) => {
    const x = 0.75 + i * 4.2;
    // Card
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.85, w: 3.9, h: 4.5,
      fill: { color: "FFFFFF" }, line: { color: t.color, width: 2 },
      shadow: { type: "outer", color: "000000", blur: 12, offset: 3, angle: 90, opacity: 0.1 },
    });
    // Top colored header
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.85, w: 3.9, h: 1.3,
      fill: { color: t.lightBg }, line: { color: t.lightBg, width: 0 },
    });
    // Icon in circle
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.3, y: 2.05, w: 0.9, h: 0.9,
      fill: { color: t.color }, line: { color: t.color, width: 0 },
    });
    s.addText(t.icon, {
      x: x + 0.3, y: 2.05, w: 0.9, h: 0.9,
      fontSize: 28, bold: true, color: C.textLight,
      align: "center", valign: "middle", margin: 0,
    });
    // Name
    s.addText(t.name, {
      x: x + 1.3, y: 2.15, w: 2.5, h: 0.4,
      fontSize: 22, fontFace: FONT_HEAD, bold: true, color: t.color, margin: 0,
    });
    // Range
    s.addText(t.range, {
      x: x + 1.3, y: 2.55, w: 2.5, h: 0.4,
      fontSize: 13, fontFace: "Consolas", color: C.textMid, margin: 0,
    });
    // Description
    s.addText(t.desc, {
      x: x + 0.25, y: 3.5, w: 3.4, h: 1.8,
      fontSize: 13, fontFace: FONT_BODY, color: C.textDark, margin: 0,
    });
    // Action label
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.25, y: 5.7, w: 3.4, h: 0.5,
      fill: { color: t.lightBg }, line: { color: t.color, width: 1 },
    });
    s.addText(t.action, {
      x: x + 0.25, y: 5.7, w: 3.4, h: 0.5,
      fontSize: 13, fontFace: FONT_BODY, bold: true, color: t.color,
      align: "center", valign: "middle", margin: 0,
    });
  });

  // Bottom note
  s.addText([
    { text: "💡 Mức sensitivity tùy chỉnh được: ", options: { color: C.textMid, italic: true } },
    { text: "Low", options: { color: C.success, bold: true } },
    { text: " (0.85/0.92)  •  ", options: { color: C.textMid } },
    { text: "Medium", options: { color: C.primary, bold: true } },
    { text: " (0.78/0.85 — mặc định)  •  ", options: { color: C.textMid } },
    { text: "High", options: { color: C.danger, bold: true } },
    { text: " (0.65/0.78)", options: { color: C.textMid } },
  ], {
    x: 0.75, y: 6.55, w: 11.8, h: 0.4,
    fontSize: 12, fontFace: FONT_BODY, align: "center", margin: 0,
  });

  addFooter(s, 9, 14);
}

// ============================================================
// SLIDE 10 — UI / UX DEMO
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Giao diện người dùng", "Popup — Banner cảnh báo — Options page");

  // 3 mock UI panels
  // Panel 1: Popup
  {
    const x = 0.75;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.7, w: 3.9, h: 5.2,
      fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 12, offset: 3, angle: 90, opacity: 0.1 },
    });
    // Mock popup header (dark gradient)
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: 1.9, w: 3.5, h: 1.3,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText("🛡  Phishing Detector", {
      x: x + 0.3, y: 2.05, w: 3.3, h: 0.35,
      fontSize: 13, fontFace: FONT_HEAD, bold: true, color: C.textLight, margin: 0,
    });
    s.addText("✓ Trang web an toàn", {
      x: x + 0.3, y: 2.45, w: 3.3, h: 0.45,
      fontSize: 15, fontFace: FONT_HEAD, bold: true, color: C.accent, margin: 0,
    });
    s.addText("12.3%  •  ML Score", {
      x: x + 0.3, y: 2.85, w: 3.3, h: 0.3,
      fontSize: 10, fontFace: FONT_BODY, color: "B3D4E8", margin: 0,
    });
    // Probability bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.3, y: 3.4, w: 3.3, h: 0.18,
      fill: { color: "E2E8F0" }, line: { color: "E2E8F0", width: 0 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.3, y: 3.4, w: 0.4, h: 0.18,
      fill: { color: C.success }, line: { color: C.success, width: 0 },
    });
    // Reason pills
    ["Domain an toàn", "Tranco Top 30K", "Tuổi domain: 10,773 ngày"].forEach((r, i) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.3, y: 3.8 + i * 0.5, w: 3.3, h: 0.4,
        fill: { color: "F8FAFC" }, line: { color: "E2E8F0", width: 1 },
      });
      s.addText("✓ " + r, {
        x: x + 0.4, y: 3.8 + i * 0.5, w: 3.2, h: 0.4,
        fontSize: 10, fontFace: FONT_BODY, color: C.textMid,
        valign: "middle", margin: 0,
      });
    });
    // Settings button
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.3, y: 6.0, w: 3.3, h: 0.5,
      fill: { color: C.bgLight }, line: { color: "E2E8F0", width: 1 },
    });
    s.addText("⚙  Cài đặt nâng cao", {
      x: x + 0.3, y: 6.0, w: 3.3, h: 0.5,
      fontSize: 11, fontFace: FONT_BODY, color: C.textMid,
      align: "center", valign: "middle", margin: 0,
    });
    // Caption below
    s.addText("Popup", {
      x, y: 6.95, w: 3.9, h: 0.3,
      fontSize: 13, fontFace: FONT_HEAD, bold: true, color: C.primary,
      align: "center", margin: 0,
    });
  }

  // Panel 2: Warning banner
  {
    const x = 4.85;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.7, w: 3.9, h: 5.2,
      fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 12, offset: 3, angle: 90, opacity: 0.1 },
    });
    // Fake browser chrome
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: 1.9, w: 3.5, h: 0.4,
      fill: { color: "E2E8F0" }, line: { color: "E2E8F0", width: 0 },
    });
    s.addText("● ● ●   paypa1-secure.xyz", {
      x: x + 0.3, y: 1.9, w: 3.3, h: 0.4,
      fontSize: 9, fontFace: FONT_BODY, color: C.textMid,
      valign: "middle", margin: 0,
    });
    // Red banner
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: 2.35, w: 3.5, h: 2.8,
      fill: { color: "B71C1C" }, line: { color: "FF1744", width: 2 },
    });
    s.addText("🚫 NGUY HIỂM", {
      x: x + 0.3, y: 2.45, w: 3.3, h: 0.4,
      fontSize: 14, fontFace: FONT_HEAD, bold: true, color: C.textLight, margin: 0,
    });
    s.addText("Trang này có thể là lừa đảo!", {
      x: x + 0.3, y: 2.8, w: 3.3, h: 0.35,
      fontSize: 11, fontFace: FONT_BODY, color: C.textLight, margin: 0,
    });
    // Probability badge
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 2.65, y: 2.5, w: 0.95, h: 0.35,
      fill: { color: "FFFFFF", transparency: 80 },
      line: { color: "FFFFFF", width: 0 },
    });
    s.addText("94.6%", {
      x: x + 2.65, y: 2.5, w: 0.95, h: 0.35,
      fontSize: 11, fontFace: FONT_HEAD, bold: true, color: C.textLight,
      align: "center", valign: "middle", margin: 0,
    });
    // Reasons
    ["• Typosquatting PayPal", "• TLD đáng ngờ (.xyz)", "• Tuổi domain: 3 ngày"].forEach((r, i) => {
      s.addText(r, {
        x: x + 0.35, y: 3.25 + i * 0.35, w: 3.25, h: 0.3,
        fontSize: 11, fontFace: FONT_BODY, color: C.textLight, margin: 0,
      });
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 2.55, y: 4.55, w: 1.05, h: 0.4,
      fill: { color: "FFFFFF", transparency: 70 }, line: { color: "FFFFFF", width: 1 },
    });
    s.addText("Đóng", {
      x: x + 2.55, y: 4.55, w: 1.05, h: 0.4,
      fontSize: 10, fontFace: FONT_BODY, bold: true, color: C.textLight,
      align: "center", valign: "middle", margin: 0,
    });
    // Page skeleton
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: 5.25, w: 3.5, h: 1.6,
      fill: { color: "F8FAFC" }, line: { color: "E2E8F0", width: 0 },
    });
    s.addText("(nội dung trang)", {
      x: x + 0.2, y: 5.25, w: 3.5, h: 1.6,
      fontSize: 11, fontFace: FONT_BODY, italic: true, color: C.textMuted,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText("Banner cảnh báo", {
      x, y: 6.95, w: 3.9, h: 0.3,
      fontSize: 13, fontFace: FONT_HEAD, bold: true, color: C.danger,
      align: "center", margin: 0,
    });
  }

  // Panel 3: Options page
  {
    const x = 8.95;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.7, w: 3.9, h: 5.2,
      fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 12, offset: 3, angle: 90, opacity: 0.1 },
    });
    // Dark header
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: 1.9, w: 3.5, h: 0.6,
      fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
    });
    s.addText("⚙  Cài đặt nâng cao", {
      x: x + 0.3, y: 1.9, w: 3.3, h: 0.6,
      fontSize: 13, fontFace: FONT_HEAD, bold: true, color: C.textLight,
      valign: "middle", margin: 0,
    });

    // Sensitivity slider
    s.addText("Sensitivity", {
      x: x + 0.3, y: 2.7, w: 3.3, h: 0.3,
      fontSize: 11, fontFace: FONT_BODY, bold: true, color: C.textDark, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.3, y: 3.05, w: 3.3, h: 0.1,
      fill: { color: "E2E8F0" }, line: { color: "E2E8F0", width: 0 },
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.85, y: 2.95, w: 0.3, h: 0.3,
      fill: { color: C.accent }, line: { color: C.primary, width: 2 },
    });
    s.addText("Low   Medium   High", {
      x: x + 0.3, y: 3.2, w: 3.3, h: 0.3,
      fontSize: 9, fontFace: FONT_BODY, color: C.textMuted, align: "center", margin: 0,
    });

    // Toggles
    const toggles = [
      ["Brand detection", true],
      ["TLD rules", true],
      ["RDAP domain age", true],
      ["DOM analysis", true],
      ["Banner display", true],
    ];
    toggles.forEach(([name, on], i) => {
      const ty = 3.7 + i * 0.45;
      s.addText(name, {
        x: x + 0.3, y: ty, w: 2.5, h: 0.35,
        fontSize: 11, fontFace: FONT_BODY, color: C.textDark,
        valign: "middle", margin: 0,
      });
      // Toggle switch
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 3.1, y: ty + 0.05, w: 0.55, h: 0.25,
        fill: { color: on ? C.success : "E2E8F0" },
        line: { color: on ? C.success : "E2E8F0", width: 0 },
      });
      s.addShape(pres.shapes.OVAL, {
        x: on ? x + 3.38 : x + 3.12, y: ty + 0.05, w: 0.23, h: 0.23,
        fill: { color: "FFFFFF" }, line: { color: "FFFFFF", width: 0 },
      });
    });

    s.addText("Options page", {
      x, y: 6.95, w: 3.9, h: 0.3,
      fontSize: 13, fontFace: FONT_HEAD, bold: true, color: C.primary,
      align: "center", margin: 0,
    });
  }

  addFooter(s, 10, 14);
}

// ============================================================
// SLIDE 11 — RESULTS
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Kết quả đạt được", "Hiệu năng model và metric trên tập test");

  // Left: Big metrics
  const metrics = [
    { val: "95.2%", label: "Accuracy" },
    { val: "94.8%", label: "Precision" },
    { val: "93.5%", label: "Recall" },
    { val: "94.1%", label: "F1-Score" },
  ];

  metrics.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.75 + col * 3.1;
    const y = 1.75 + row * 2.5;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.95, h: 2.3,
      fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 10, offset: 3, angle: 90, opacity: 0.08 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.95, h: 0.08,
      fill: { color: C.accent }, line: { color: C.accent, width: 0 },
    });
    s.addText(m.val, {
      x, y: y + 0.4, w: 2.95, h: 1.3,
      fontSize: 56, fontFace: FONT_HEAD, bold: true, color: C.primary,
      align: "center", margin: 0,
    });
    s.addText(m.label, {
      x, y: y + 1.65, w: 2.95, h: 0.4,
      fontSize: 14, fontFace: FONT_BODY, color: C.textMid,
      align: "center", charSpacing: 2, margin: 0,
    });
  });

  // Right: Bar chart
  s.addChart(pres.charts.BAR, [{
    name: "Metrics",
    labels: ["Accuracy", "Precision", "Recall", "F1", "AUC-ROC"],
    values: [95.2, 94.8, 93.5, 94.1, 97.3],
  }], {
    x: 7.2, y: 1.75, w: 5.6, h: 3.8,
    barDir: "col",
    chartColors: [C.primary],
    chartArea: { fill: { color: "FFFFFF" } },
    catAxisLabelColor: C.textMid, valAxisLabelColor: C.textMid,
    catAxisLabelFontSize: 11, valAxisLabelFontSize: 10,
    valGridLine: { color: "E2E8F0", size: 0.5 },
    catGridLine: { style: "none" },
    showValue: true, dataLabelPosition: "outEnd",
    dataLabelColor: C.textDark, dataLabelFontSize: 11,
    showLegend: false,
    showTitle: true, title: "XGBoost Performance (%)",
    titleColor: C.textDark, titleFontSize: 14,
    valAxisMinVal: 80, valAxisMaxVal: 100,
  });

  // Bottom: inference stats
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.2, y: 5.75, w: 5.6, h: 1.2,
    fill: { color: C.bgDark }, line: { color: C.bgDark, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.2, y: 5.75, w: 0.08, h: 1.2,
    fill: { color: C.accent }, line: { color: C.accent, width: 0 },
  });
  s.addText([
    { text: "⚡  ", options: { fontSize: 16 } },
    { text: "<5ms", options: { color: C.accent, bold: true, fontSize: 18 } },
    { text: "  inference  /  ", options: { color: "B3D4E8", fontSize: 13 } },
    { text: "402 KB", options: { color: C.accent, bold: true, fontSize: 18 } },
    { text: "  model size", options: { color: "B3D4E8", fontSize: 13, breakLine: true } },
    { text: "Chạy hoàn toàn offline, không gửi URL ra ngoài", options: { color: C.textLight, fontSize: 12, italic: true } },
  ], {
    x: 7.4, y: 5.85, w: 5.3, h: 1, fontFace: FONT_BODY, margin: 0,
  });

  addFooter(s, 11, 14);
}

// ============================================================
// SLIDE 12 — LIMITATIONS & FUTURE WORK
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Hạn chế & hướng phát triển", "Nhìn thẳng vào điểm yếu để tiếp tục cải thiện");

  // Two-column: Limitations | Future Work
  const limits = [
    "Model train trên dataset tĩnh — cần retrain định kỳ khi kẻ tấn công đổi chiến thuật",
    "Zero-day phishing (URL chưa từng xuất hiện) có thể lọt qua nếu không có dấu hiệu rõ ràng",
    "Heuristic dựa trên TLD/brand list — có thể bị lách nếu kẻ tấn công đọc source code",
    "Chỉ hỗ trợ ngôn ngữ tiếng Việt trên UI, chưa i18n",
  ];
  const futures = [
    "Federated Learning — train trên client, không gửi dữ liệu thô",
    "Thu thập dữ liệu thực tế qua opt-in để retrain model 3-6 tháng/lần",
    "Tích hợp VirusTotal API làm lớp phòng thủ thứ 9 (optional)",
    "Mở rộng sang Firefox, Edge, Safari với thay đổi tối thiểu",
    "Đồng bộ settings qua chrome.storage.sync đa thiết bị",
  ];

  // Left card: Limitations
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.75, y: 1.7, w: 6.0, h: 5.2,
    fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
    shadow: { type: "outer", color: "000000", blur: 10, offset: 3, angle: 90, opacity: 0.08 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.75, y: 1.7, w: 6.0, h: 0.7,
    fill: { color: C.accentWarm }, line: { color: C.accentWarm, width: 0 },
  });
  s.addText("⚠  HẠN CHẾ HIỆN TẠI", {
    x: 1.0, y: 1.7, w: 5.8, h: 0.7,
    fontSize: 16, fontFace: FONT_HEAD, bold: true, color: C.textLight,
    valign: "middle", charSpacing: 2, margin: 0,
  });
  limits.forEach((txt, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 1.0, y: 2.75 + i * 1.0, w: 0.25, h: 0.25,
      fill: { color: C.accentWarm }, line: { color: C.accentWarm, width: 0 },
    });
    s.addText(txt, {
      x: 1.4, y: 2.65 + i * 1.0, w: 5.25, h: 0.9,
      fontSize: 12, fontFace: FONT_BODY, color: C.textDark, margin: 0,
    });
  });

  // Right card: Future Work
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.95, y: 1.7, w: 6.0, h: 5.2,
    fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
    shadow: { type: "outer", color: "000000", blur: 10, offset: 3, angle: 90, opacity: 0.08 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.95, y: 1.7, w: 6.0, h: 0.7,
    fill: { color: C.primary }, line: { color: C.primary, width: 0 },
  });
  s.addText("🚀  HƯỚNG PHÁT TRIỂN", {
    x: 7.2, y: 1.7, w: 5.8, h: 0.7,
    fontSize: 16, fontFace: FONT_HEAD, bold: true, color: C.textLight,
    valign: "middle", charSpacing: 2, margin: 0,
  });
  futures.forEach((txt, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 7.2, y: 2.7 + i * 0.85, w: 0.25, h: 0.25,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    s.addText(txt, {
      x: 7.6, y: 2.6 + i * 0.85, w: 5.25, h: 0.8,
      fontSize: 12, fontFace: FONT_BODY, color: C.textDark, margin: 0,
    });
  });

  addFooter(s, 12, 14);
}

// ============================================================
// SLIDE 13 — TECH STACK
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };
  addSlideTitle(s, "Công nghệ sử dụng", "Mỗi công cụ được chọn có lý do cụ thể");

  const techs = [
    { name: "XGBoost",          why: "Accuracy cao, xuất JSON chạy được trong browser, inference <5ms",   color: C.primary },
    { name: "Manifest V3",      why: "Chuẩn mới của Chrome từ 2024, service worker tiết kiệm RAM",         color: C.secondary },
    { name: "Vanilla JS",       why: "Bundle nhỏ, không phụ thuộc framework, khuyến khích bởi MV3",        color: C.accentWarm },
    { name: "Levenshtein",      why: "Phát hiện typosquatting (paypa1.com, g00gle.com)",                    color: C.warning },
    { name: "Tranco Top 30K",   why: "Thay Alexa (đã ngừng), whitelist site uy tín",                        color: C.success },
    { name: "RDAP Protocol",    why: "Thay WHOIS — trả JSON chuẩn, truy cập qua HTTPS",                     color: "9333EA" },
    { name: "Python + sklearn", why: "Training offline, ecosystem ML chuẩn công nghiệp",                   color: C.danger },
    { name: "chrome.storage",   why: "Đồng bộ giữa popup/background/content, event onChanged",            color: C.textMid },
  ];

  techs.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.75 + col * 6.2;
    const y = 1.75 + row * 1.3;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 5.9, h: 1.15,
      fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.06 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.1, h: 1.15,
      fill: { color: t.color }, line: { color: t.color, width: 0 },
    });
    s.addText(t.name, {
      x: x + 0.25, y: y + 0.12, w: 5.5, h: 0.4,
      fontSize: 16, fontFace: FONT_HEAD, bold: true, color: C.textDark, margin: 0,
    });
    s.addText(t.why, {
      x: x + 0.25, y: y + 0.5, w: 5.5, h: 0.6,
      fontSize: 11, fontFace: FONT_BODY, italic: true, color: C.textMid, margin: 0,
    });
  });

  addFooter(s, 13, 14);
}

// ============================================================
// SLIDE 14 — THANK YOU / Q&A
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bgDark };

  // Decorative lines
  s.addShape(pres.shapes.LINE, {
    x: 0, y: 1.2, w: 13.3, h: 0,
    line: { color: C.accent, width: 1, transparency: 70 },
  });
  s.addShape(pres.shapes.LINE, {
    x: 0, y: 6.3, w: 13.3, h: 0,
    line: { color: C.accent, width: 1, transparency: 70 },
  });

  // Big "Thank you"
  s.addText("Cảm ơn thầy/cô", {
    x: 0.5, y: 2.0, w: 12.3, h: 1.0,
    fontSize: 54, fontFace: FONT_HEAD, bold: true, color: C.textLight,
    align: "center", margin: 0,
  });
  s.addText("đã lắng nghe!", {
    x: 0.5, y: 2.95, w: 12.3, h: 0.8,
    fontSize: 32, fontFace: FONT_BODY, color: "B3D4E8",
    align: "center", margin: 0,
  });

  // Divider
  s.addShape(pres.shapes.LINE, {
    x: 5.65, y: 4.1, w: 2, h: 0,
    line: { color: C.accent, width: 2 },
  });

  // Q&A label
  s.addText("Q & A", {
    x: 0.5, y: 4.3, w: 12.3, h: 0.6,
    fontSize: 36, fontFace: FONT_HEAD, bold: true, color: C.accent,
    align: "center", charSpacing: 8, margin: 0,
  });
  s.addText("Em sẵn sàng lắng nghe câu hỏi và góp ý", {
    x: 0.5, y: 5.0, w: 12.3, h: 0.4,
    fontSize: 16, fontFace: FONT_BODY, italic: true, color: "B3D4E8",
    align: "center", margin: 0,
  });

  // Footer with contact
  s.addText([
    { text: "Trần Duy Thái  •  ", options: { color: C.textLight, fontSize: 12 } },
    { text: "MSSV 2387700060  •  ", options: { color: C.textMuted, fontSize: 12 } },
    { text: "HUTECH University  •  ", options: { color: C.textMuted, fontSize: 12 } },
    { text: "DACS 2026", options: { color: C.accent, fontSize: 12, bold: true } },
  ], {
    x: 0.5, y: 6.5, w: 12.3, h: 0.4,
    fontFace: FONT_BODY, align: "center", margin: 0,
  });
}

// ============================================================
// EXPORT
// ============================================================
pres.writeFile({ fileName: "Slide_DACS_TranDuyThai.pptx" })
  .then(fileName => console.log(`✅ Generated: ${fileName}`));
