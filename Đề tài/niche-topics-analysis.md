# Phân tích các đề tài "Ngách" (Niche) và Độc bản trong Cụm 1 (Hybrid AI & Symbolic)

Hướng đi Hybrid (LLM + Symbolic/Wolfram) bản chất đã rất mới, nhưng trong cụm này có những đề tài mang tính "Dark Horse" - ít sinh viên chọn vì đòi hỏi tư duy toán học kết hợp kỹ thuật sâu, nhưng lại là điểm cộng cực lớn khi bảo vệ.

Dưới đây là 5 đề tài "độc" được lọc ra:

### 1. Rank 18 (#208): GNN + Symbolic Centrality for Malware Propagation

* **Tại sao ít người làm:** Đa số sinh viên chỉ làm phát hiện malware đơn lẻ. Đề tài này nhìn malware dưới góc độ "mạng máy tính là một đồ thị".
* **Cái "Độc":** Bạn dùng **Graph Neural Network (GNN)** để dự đoán độ nguy hiểm, nhưng dùng **Wolfram/Symbolic** để tính toán các chỉ số trung tâm (centrality) của đồ thị.
* **Demo:** Một bản đồ các máy tính chạy animation lây lan mã độc, hiển thị các nút "tử huyệt" được tính toán bằng toán học để biết cần cắt đứt chỗ nào là hiệu quả nhất.

### 2. Rank 12 (#206): Side-Channel Analysis with Arbitrary Precision

* **Tại sao ít người làm:** Phân tích kênh kề (Side-channel) thường bị coi là "khó nuốt" và yêu cầu phần cứng.
* **Cái "Độc":** Thay vì dùng phần cứng thật, bạn dùng **Symbolic Computation** (Wolfram/Python) để mô phỏng sự rò rỉ năng lượng hoặc độ trễ thời gian của thuật toán mã hóa với độ chính xác vô hạn (arbitrary precision).
* **Demo:** Chứng minh được chỉ bằng việc đo thời gian chạy hàm băm, AI của bạn có thể suy đoán được các bit của khóa bí mật. Hội đồng sẽ thấy đây là đề tài cực kỳ "hard-core".

### 3. Rank 40 (#215): Symbolic Time Series Analysis for APT Detection

* **Tại sao ít người làm:** Phát hiện APT (tấn công có chủ đích) thường dùng Rule-based hoặc ML thuần.
* **Cái "Độc":** Sử dụng **Biến đổi Fourier/Wavelet symbolic** để lọc nhiễu trong log hệ thống, sau đó dùng AI để tìm ra các mẫu (pattern) tấn công ẩn nấp trong thời gian dài.
* **Demo:** Một Dashboard hiển thị lưu lượng mạng dưới dạng sóng toán học, chỉ điểm chính xác thời điểm kẻ tấn công "nằm vùng" mà các tool bình thường bỏ qua.

### 4. Rank 36 (#214): Symbolic Game Theory for Cyber Defense

* **Tại sao ít người làm:** Lý thuyết trò chơi (Game Theory) thường nằm trên giấy tờ/luận văn lý thuyết.
* **Cái "Độc":** Hiện thực hóa nó! Xây dựng mô hình **Attacker-Defender** trong mạng doanh nghiệp. Dùng Wolfram giải các hệ phương trình cân bằng Nash để đưa ra chiến thuật phòng thủ tối ưu nhất.
* **Demo:** Một kịch bản "Mèo vờn chuột": Khi kẻ địch tấn công A, hệ thống dựa trên toán học tự động dời dữ liệu sang B hoặc kích hoạt Honeypot để bẫy địch.

### 5. Rank 47 (#217): Symbolic Differential Privacy Calculator

* **Tại sao ít người làm:** Differential Privacy (Quyền riêng tư vi phân) cực kỳ hot nhưng toán học đằng sau nó (Epsilon-Delta) rất phức tạp.
* **Cái "Độc":** Bạn xây dựng một công cụ giúp doanh nghiệp "xào nấu" dữ liệu sao cho vẫn dùng được để train AI nhưng không bị lộ thông tin cá nhân. Wolfram sẽ tính toán chính xác "ngân sách quyền riêng tư" (privacy budget) bị tiêu tốn.
* **Demo:** Cho thầy cô thấy một tập dữ liệu nhạy cảm, sau khi qua tool của bạn, AI vẫn học được xu hướng nhưng không ai có thể truy ngược lại danh tính cá nhân.

---

### Lời khuyên cho bạn (Thái)

Nếu bạn muốn **Demo ấn tượng nhất thị giác**, hãy chọn **#208 (GNN + Graph)** hoặc **#214 (Game Theory)**.
Nếu bạn muốn **Khẳng định trình độ toán học/mật mã học**, hãy chọn **#206 (Side-channel)** hoặc **#217 (Privacy)**.

Bạn có cảm thấy "rung động" với đề tài nào trong số này không? Mình sẽ hỗ trợ bạn đi sâu vào đề tài đó.
