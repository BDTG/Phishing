# **ĐỀ CƯƠNG ĐĂNG KÝ ĐỀ TÀI ĐỒ ÁN CS/CN**

| Tên đề tài (ghi IN HOA): MÔ PHỎNG LÂY LAN MÃ ĐỘC TRÊN MẠNG NỘI BỘ DOANH NGHIỆP BẰNG MÔ HÌNH SIR KẾT HỢP HYBRID AI & SYMBOLIC COMPUTATION |  |
| :---- | :---: |
| **Ngành học :**  An toàn thông tin: **🗹** |  |
|  |  |
| **Thời gian thực hiện: 10 tuần.** Từ tháng 3/2026 |  |
| **Sinh viên thực hiện:** Họ tên : Trần Duy Thái | MSSV: 2387700060 | Email: normalprojectmain@gmail.com | Điện thoại: 0396769105 |
|  |   |

# **MÔ TẢ CHI TIẾT ĐỀ TÀI** 

## 1. Nội dung

### 1.1 Giới thiệu đề tài

- **Bài toán/vấn đề cần giải quyết:** Trong môi trường mạng nội bộ doanh nghiệp hiện đại, các dạng mã độc lây lan nhanh như Ransomware (WannaCry), Worms (Conficker), hoặc Trojan lây qua lỗ hổng hệ thống thường tàn phá hệ thống trước khi các giải pháp tĩnh (signature-based) kịp phản ứng. Đề tài này giải quyết bài toán dự báo phòng thủ chủ động bằng cách xây dựng một trình mô phỏng tương tác (tương tự cơ chế game mô phỏng dịch bệnh Plague Inc.) cho phép người dùng lựa chọn các mẫu mã độc phổ biến, "thả" vào một hệ thống mạng giả lập, và quan sát quá trình lây lan từng bước dựa trên mô hình toán học dịch tễ SIR.
- **Mô tả input và output:**
  - *Input:* Cấu trúc mạng (Graph/Topology), lựa chọn loại mã độc phổ biến từ danh sách có sẵn (Ransomware, Worms, Trojan), và node khởi phát lây nhiễm ban đầu.
  - *Output:* Dashboard mô phỏng từng bước hiển thị quá trình lây lan trên đồ thị mạng, đường cong SIR, chỉ số lây nhiễm cơ bản R₀, và danh sách top 3 node quan trọng nhất cần ưu tiên cô lập.
- **Lý do chọn đề tài:** Kết hợp giữa mô hình ngôn ngữ lớn (LLM) — đóng vai trò giải thích kết quả mô phỏng và đưa ra khuyến nghị phòng thủ — với tính toán ký hiệu (Symbolic Computation thông qua Wolfram Alpha API / SymPy) giúp loại bỏ ảo giác (hallucination) của AI.
- **Khả năng ứng dụng thực tế:** Cung cấp trực tiếp cho trung tâm điều hành an ninh mạng (SOC), giúp quản trị viên có cái nhìn trực quan về chiến lược phòng thủ, giảm thiểu chi phí ứng cứu sự cố.
- **Tính thời sự:** Đề tài tiên phong ứng dụng cơ chế Hybrid AI & Symbolic Computation, một xu hướng hàng đầu năm 2026 theo Gartner.

### 1.2 Mục tiêu đề tài

- Xây dựng thành công mô hình toán học SIR để biểu diễn sự lây nhiễm của các loại mã độc phổ biến trên đồ thị mạng.
- Tự động hóa giải các phương trình vi phân bằng Python kết nối với Wolfram Alpha API (hoặc SymPy).
- Phát triển Dashboard mô phỏng tương tác kiểu Plague Inc. trên giao diện web.
- Hiển thị top 3 node quan trọng nhất cần ưu tiên cô lập, kèm lời giải thích bằng ngôn ngữ tự nhiên từ LLM.

### 1.3 Nội dung nghiên cứu của đề tài

- **Nghiên cứu lý thuyết:** Khảo sát mô hình dịch tễ học SIR và Symbolic Computation trong bảo mật mạng.
- **Thiết kế hệ thống:** Thiết lập môi trường đồ thị bằng NetworkX biểu diễn mạng ảo và xây dựng bộ tham số virus (β, γ).
- **Triển khai thực nghiệm:** Lập trình trình mô phỏng bằng Python + Streamlit + Wolfram Alpha API + Gemini Flash.
- **Đánh giá kết quả:** So sánh tốc độ lây lan và hiệu quả cô lập node quan trọng.

### 1.4 Phương pháp thực hiện

- **Phân tích lý thuyết, nghiên cứu tài liệu:** Tổng hợp nghiên cứu IEEE/ACM về mô hình dịch tễ và lý thuyết đồ thị.
- **Xây dựng mô hình hệ thống thử nghiệm:** Sử dụng thư viện NetworkX, scipy và Streamlit để xây dựng giao diện mô phỏng.
- **Thu thập dữ liệu, tiến hành thực nghiệm:** Sinh topology mạng và bộ tham số virus dựa trên tài liệu nghiên cứu.
- **Đánh giá và tối ưu hóa:** So sánh kết quả từ Wolfram Alpha API với SymPy để đảm bảo tính chính xác và giảm phụ thuộc API.

### 1.5 Kết quả, sản phẩm dự kiến

- **Sản phẩm cứng:** Mã nguồn GitHub, trình mô phỏng lây lan mã độc (Web App Streamlit), Docker Image.
- **Sản phẩm mềm:** Báo cáo phân tích so sánh hiệu quả lây lan và hiệu quả phòng thủ.

### 1.6 Tài liệu tham khảo

1. Kephart, J. O., & White, S. R. (1991). "Directed-graph epidemiological models of computer viruses". IEEE Symposium on Research in Security and Privacy.
2. Pastor-Satorras, R., & Vespignani, A. (2001). "Epidemic Spreading in Scale-Free Networks". Physical Review Letters.
3. Van Mieghem, P. et al. (2009). "Virus Spread in Networks". IEEE/ACM Transactions on Networking.
4. Kermack, W. O., & McKendrick, A. G. (1927). "A contribution to the mathematical theory of epidemics". Proceedings of the Royal Society A.
5. Wolfram, S. (2023). "ChatGPT Gets Its 'Wolfram Superpowers'". Stephen Wolfram Writings.
