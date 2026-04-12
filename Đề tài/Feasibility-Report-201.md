# BÁO CÁO ĐÁNH GIÁ TÍNH KHẢ THI — Đề tài #201
**Symbolic Malware Epidemic Simulator**
Ngày đánh giá: 2026-03-11

---

## 🟢 KẾT LUẬN TỔNG QUÁT: KHẢ THI — nhưng cần sửa 4 điểm quan trọng

| Tiêu chí | Đánh giá | Ghi chú |
| :--- | :---: | :--- |
| Kỹ thuật (Code được không?) | 🟢 Khả thi | Python + API, không cần phần cứng đặc biệt |
| Thời gian (10 tuần đủ không?) | 🟡 Cần lưu ý | Scope hơi rộng, cần giảm bớt 1-2 tính năng |
| Chi phí (Miễn phí được không?) | 🟢 Khả thi | Wolfram API Free = 2000 calls/tháng, LLM Free Tier đủ dùng |
| Học thuật (Giảng viên chấp nhận?) | 🟡 Cần sửa | Tài liệu tham khảo hiện tại quá yếu |
| Rủi ro kỹ thuật | 🟡 Trung bình | Phụ thuộc API bên ngoài (Wolfram, LLM) |
| Demo ấn tượng | 🟢 Rất tốt | Dashboard animation là điểm cộng lớn |

---

## 📋 PHÂN TÍCH CHI TIẾT 6 GÓC ĐỘ

### 1. 🔧 Kỹ thuật — CÓ LÀM ĐƯỢC KHÔNG?

**✅ Những phần hoàn toàn khả thi:**
- Mô hình SIR (Susceptible-Infected-Recovered) là mô hình toán học cơ bản, đã có sẵn rất nhiều code mẫu trong Python (thư viện `scipy.integrate.odeint`).
- NetworkX là thư viện Python miễn phí, rất mạnh cho việc biểu diễn đồ thị mạng.
- Wolfram Alpha API có gói miễn phí (2000 calls/tháng) — đủ cho việc demo và test.
- Dashboard bằng Streamlit chỉ cần khoảng 200-300 dòng code Python.

**⚠️ Điểm cần lưu ý:**
- Đề cương viết "thời gian thực" (real-time) — điều này **hơi quá tham vọng** cho 10 tuần. Thực tế, bạn nên làm dạng **"mô phỏng từng bước"** (step-by-step simulation), nghĩa là người dùng nhấn nút -> chạy 1 vòng tính toán -> hiển thị kết quả. Vẫn rất ấn tượng nhưng code đơn giản hơn rất nhiều.
- Phần LLM "trích xuất hành vi mã độc" — thực tế LLM sẽ được dùng để **giải thích kết quả** (bằng ngôn ngữ tự nhiên) hơn là "trích xuất hành vi". Nên điều chỉnh lại mô tả cho đúng thực tế.

---

### 2. ⏰ Thời gian — 10 TUẦN ĐỦ KHÔNG?

| Tuần | Công việc | Rủi ro |
| :---: | :--- | :---: |
| 1-2 | Nghiên cứu lý thuyết SIR, cài đặt môi trường Python, tạo Graph mẫu | Thấp |
| 3-4 | Code mô hình SIR trên Graph (NetworkX + scipy) | Thấp |
| 5-6 | Tích hợp Wolfram Alpha API để giải phương trình symbolic | Trung bình |
| 7-8 | Xây dựng Dashboard Streamlit + Animation lây lan | Thấp |
| 9 | Test, fix bug, đóng gói Docker | Trung bình |
| 10 | Viết báo cáo, chuẩn bị slide bảo vệ | Thấp |

**⚠️ Vấn đề:** Đề cương hiện tại đưa vào **quá nhiều tính năng** cho 10 tuần:
- ❌ "Tự động cảnh báo 1-3 hành động tối ưu" → Nên **giảm xuống** thành: "Hiển thị top 3 node quan trọng nhất dựa trên Betweenness Centrality" (đây là phép tính có sẵn trong NetworkX, không cần code thêm).
- ❌ "FastAPI backend" → Không cần thiết nếu dùng Streamlit (Streamlit đã tích hợp backend).

---

### 3. 💰 Chi phí — CÓ TỐN TIỀN KHÔNG?

| Công cụ | Chi phí | Ghi chú |
| :--- | :--- | :--- |
| Python + NetworkX + scipy | **$0** | Open source |
| Wolfram Alpha API | **$0** | Free tier: 2000 calls/tháng (AppID miễn phí) |
| LLM API (Gemini 2.0 Flash) | **$0** | Google AI Studio free tier |
| Streamlit | **$0** | Open source, deploy miễn phí trên Streamlit Cloud |
| GitHub | **$0** | Free |
| Docker | **$0** | Free |

**✅ Tổng chi phí: 0 đồng.** Hoàn toàn khả thi cho sinh viên.

---

### 4. 📚 Học thuật — GIẢNG VIÊN CÓ CHẤP NHẬN KHÔNG?

**🔴 VẤN ĐỀ NGHIÊM TRỌNG NHẤT CỦA ĐỀ CƯƠNG HIỆN TẠI:**

Phần **1.6 Tài liệu tham khảo** hiện tại rất yếu:
- `J. Smith et al.` → Tên tác giả chung chung, khó xác minh.
- `Wolfram Research, Whitepaper 2025 (Dự kiến)` → Giảng viên sẽ hỏi: "Tài liệu chưa xuất bản thì em tham khảo cái gì?"
- Thiếu hoàn toàn các bài báo **IEEE/ACM/Springer** thực sự.

**🔧 Cần thay bằng tài liệu thật (mình đã tìm sẵn cho bạn):**

1. Kephart, J. O., & White, S. R. (1991). *"Directed-graph epidemiological models of computer viruses"*. IEEE Computer Society Symposium on Research in Security and Privacy. → **Bài gốc kinh điển** về ứng dụng mô hình dịch tễ cho virus máy tính.
2. Pastor-Satorras, R., & Vespignani, A. (2001). *"Epidemic Spreading in Scale-Free Networks"*. Physical Review Letters, 86(14). → **Bài báo nền tảng** về lây lan trên đồ thị (được trích dẫn >7000 lần).
3. Van Mieghem, P. et al. (2009). *"Virus Spread in Networks"*. IEEE/ACM Transactions on Networking, 17(1). → Phân tích toán học SIS/SIR trên đồ thị mạng.
4. Wolfram, S. (2023). *"ChatGPT Gets Its 'Wolfram Superpowers'"*. Stephen Wolfram Writings. → Blog chính thức của Wolfram về tích hợp LLM + Symbolic.
5. Kermack, W. O., & McKendrick, A. G. (1927). *"A contribution to the mathematical theory of epidemics"*. Proceedings of the Royal Society A. → Bài gốc mô hình SIR (kinh điển).

---

### 5. ⚡ Rủi ro kỹ thuật

| Rủi ro | Xác suất | Giải pháp dự phòng |
| :--- | :---: | :--- |
| Wolfram API bị giới hạn/chậm | Trung bình | Dùng `SymPy` (thư viện Python miễn phí) làm backup. SymPy cũng giải được phương trình vi phân symbolic. |
| LLM API bị rate limit | Thấp | Dùng Gemini Flash (free, 60 requests/phút) hoặc cache kết quả. |
| Graph quá lớn chạy chậm | Thấp | Giới hạn demo ở 50-100 node là đủ ấn tượng. |
| Không hiểu toán SIR | Thấp | SIR chỉ gồm 3 phương trình vi phân đơn giản, có sẵn hàng trăm tutorial trên YouTube. |

---

### 6. 🎯 Demo có ấn tượng không?

**✅ CỰC KỲ ẤN TƯỢNG** nếu bạn làm đúng flow sau:

```
Bước 1: Upload file mô tả mạng (hoặc chọn mẫu có sẵn)
        → Dashboard hiện ra sơ đồ mạng với các node xanh lá (Clean)

Bước 2: Chọn loại malware + node bắt đầu lây nhiễm
        → Node đó chuyển sang đỏ

Bước 3: Nhấn "Simulate"
        → Animation từng bước: các node lần lượt chuyển đỏ
        → Biểu đồ đường cong SIR (giống đường cong COVID) hiện bên cạnh
        → Wolfram API trả về công thức toán học chính xác

Bước 4: Nhấn "Recommend Defense"
        → Highlight 3 node quan trọng nhất (Betweenness Centrality cao nhất)
        → LLM giải thích bằng tiếng Việt: "Nên ngắt kết nối máy X vì..."
```

---

## 📝 4 ĐIỂM CẦN SỬA TRONG ĐỀ CƯƠNG TRƯỚC KHI NỘP

| # | Vấn đề | Cách sửa |
| :---: | :--- | :--- |
| 1 | **Tài liệu tham khảo giả/yếu** | Thay bằng 5 tài liệu thật mình liệt kê ở trên |
| 2 | **"Thời gian thực" quá tham vọng** | Đổi thành "mô phỏng từng bước" (step-by-step simulation) |
| 3 | **Vai trò LLM mơ hồ** | Nói rõ: LLM dùng để giải thích kết quả + phân loại malware, KHÔNG dùng để tính toán |
| 4 | **Lỗi chính tả "NetowrkX"** | Sửa thành "NetworkX" |

---

> **Đánh giá cuối cùng:** Đề tài #201 là **KHẢ THI** cho 10 tuần với 1-2 sinh viên, chi phí 0 đồng, và có tiềm năng Demo cực ấn tượng. Chỉ cần sửa 4 điểm trên là có thể nộp cho giảng viên duyệt ngay.
