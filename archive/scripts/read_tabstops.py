import win32com.client
import os

word = win32com.client.Dispatch('Word.Application')
word.Visible = False

# Đọc file đã sửa thủ công
path = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\Báo cáo\BaoCao_DACS_TranDuyThai_Final11.docx'
doc = word.Documents.Open(path)

print("=== TAB STOPS của các đoạn quan trọng ===\n")
for para in doc.Paragraphs:
    t = para.Range.Text.strip()
    if any(kw in t for kw in ['Ngành:', 'Chuyên ngành:', 'Giảng viên', 'Sinh viên', 'MSSV']):
        stops = [(ts.Position, ts.Alignment) for ts in para.TabStops]
        indent_left = para.LeftIndent
        indent_first = para.FirstLineIndent
        print(f"Para: {repr(t[:50])}")
        print(f"  TabStops: {stops}")
        print(f"  LeftIndent={indent_left:.1f}pt, FirstLineIndent={indent_first:.1f}pt")
        print()

doc.Close(False)
word.Quit()
