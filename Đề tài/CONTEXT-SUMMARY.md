# CONTEXT SUMMARY — Đồ Án Chuyên Ngành #201
**Cập nhật:** 2026-03-11 16:11

---

## 🎯 Đề tài
**Mô phỏng lây lan mã độc trên mạng nội bộ doanh nghiệp** bằng mô hình toán học dịch tễ SIR kết hợp Hybrid AI & Symbolic Computation.

**Ý tưởng cốt lõi:** Xây dựng trình mô phỏng **kiểu Plague Inc.** — người dùng chọn loại virus phổ biến (Ransomware/Worms/Trojan), "thả" vào mạng giả lập, xem lây lan từng bước trên Dashboard web.

## 👤 Thông tin sinh viên
- Làm **1 mình** (giảng viên đã duyệt cho làm solo dù form yêu cầu 2 người)
- **Deadline đăng ký:** 23:59 ngày 13/03/2026
- Email đăng ký: normalprojectmain@gmail.com

## 📂 Các file quan trọng
- **Đề cương (đã sửa xong):** `c:\Users\BDTG\Desktop\Đồ Án Chuyên Ngành\Đề tài\De-Cuong-Do-An-201-Malware-Epidemic.md`
- **Báo cáo đánh giá khả thi:** `c:\Users\BDTG\Desktop\Đồ Án Chuyên Ngành\Đề tài\Feasibility-Report-201.md`

## 🛠️ Tech Stack đã chốt
| Thành phần | Công cụ | Chi phí |
|:---|:---|:---:|
| Ngôn ngữ | Python 3.11+ | $0 |
| Đồ thị mạng | NetworkX | $0 |
| Giải phương trình SIR | Wolfram Alpha API (free tier 2000 calls/tháng) + SymPy (backup offline) | $0 |
| Dashboard/UI | Streamlit (mô phỏng tương tác kiểu Plague Inc.) | $0 |
| Giải thích kết quả | LLM API — Gemini Flash free tier | $0 |
| Đóng gói | Docker | $0 |

## ✅ Những gì đã làm xong
1. ✅ Viết đề cương đầy đủ 6 mục (giới thiệu, mục tiêu, nội dung nghiên cứu, phương pháp, sản phẩm dự kiến, tài liệu tham khảo)
2. ✅ Đánh giá tính khả thi từ 6 góc độ → KẾT LUẬN: KHẢ THI
3. ✅ Sửa 4 lỗi trong đề cương:
   - Thay tài liệu tham khảo giả bằng 5 bài báo IEEE/ACM thật
   - Đổi "thời gian thực" → mô phỏng từng bước kiểu Plague Inc.  
   - Làm rõ vai trò LLM (giải thích kết quả, KHÔNG tính toán)
   - Sửa typo "NetowrkX" → "NetworkX"

## ⬜ Việc còn lại
- Tải file mẫu đề cương từ form Google, copy nội dung vào
- Điền Google Form đăng ký đề tài
- Forward email cho GVHD
- Tra cứu thêm tài liệu tham khảo bằng NotebookLM

## 🔑 Kiến trúc hệ thống (flow chính)
```
Người dùng chọn virus + node khởi phát
    → NetworkX tạo đồ thị mạng
    → Wolfram Alpha / SymPy giải hệ phương trình vi phân SIR
    → Streamlit hiển thị animation lây lan từng bước + đường cong SIR
    → LLM giải thích kết quả + đề xuất top 3 node cần cô lập (Betweenness Centrality)
```

## 📚 Tài liệu tham khảo (đã xác minh)
1. Kephart & White (1991) — *Directed-graph epidemiological models of computer viruses* (IEEE)
2. Pastor-Satorras & Vespignani (2001) — *Epidemic Spreading in Scale-Free Networks* (Physical Review Letters, 7000+ citations)
3. Van Mieghem et al. (2009) — *Virus Spread in Networks* (IEEE/ACM Transactions on Networking)
4. Kermack & McKendrick (1927) — *A contribution to the mathematical theory of epidemics* (bài gốc SIR)
5. Wolfram (2023) — *ChatGPT Gets Its 'Wolfram Superpowers'* (blog chính thức)
