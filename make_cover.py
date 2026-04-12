import win32com.client
import os

word = win32com.client.Dispatch('Word.Application')
word.Visible = False

base      = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở'
doc_path  = os.path.join(base, '[3] Trang bia DACS.doc')
cover_out = os.path.join(base, 'Báo cáo', 'cover_filled.docx')
report_in = os.path.join(base, 'Báo cáo', 'BaoCao_DACS_TranDuyThai_v7.docx')
final_out = os.path.join(base, 'Báo cáo', 'BaoCao_DACS_TranDuyThai_Final10.docx')

REPLACEMENTS = {
    "<TÊN ĐỀ TÀI >":     "XÂY DỰNG CÔNG CỤ PHÁT HIỆN URL LỪA ĐẢO TRÊN WEBSITE SỬ DỤNG HỌC MÁY",
    "<TÊN NGÀNH>":        "An toàn thông tin",
    "<TÊN CHUYÊN NGÀNH>": "An toàn thông tin",
    "<năm>":              "2026",
}
PERSON_FILLS = [
    ("Giảng viên hướng dẫn", "Đinh Huỳnh Tuệ Tuệ"),
    ("Sinh viên thực hiện",  "Trần Duy Thái"),
]

# ============================================================
# STEP 1: Fill placeholders in template
# ============================================================
print("Opening template...")
doc = word.Documents.Open(doc_path)

for i in range(1, 50):
    try:
        story = doc.StoryRanges(i)
        while story:
            for para in story.Paragraphs:
                t = para.Range.Text
                new_t = t
                for find_t, rep_t in REPLACEMENTS.items():
                    new_t = new_t.replace(find_t, rep_t)
                for label, name in PERSON_FILLS:
                    if label in new_t and name not in new_t:
                        new_t = new_t.rstrip('\r\n\x07') + ' ' + name + '\r'
                if 'MSSV:' in new_t and '2387700060' not in new_t:
                    new_t = 'MSSV: 2387700060\tLớp: 23DATA1\r'
                if new_t != t:
                    para.Range.Text = new_t
                    print(f"  OK: {repr(new_t[:70])}")
            try:
                story = story.NextStoryRange
            except:
                break
    except:
        pass

for tbl in doc.Tables:
    for row in tbl.Rows:
        for cell in row.Cells:
            t = cell.Range.Text
            new_t = t
            for find_t, rep_t in REPLACEMENTS.items():
                new_t = new_t.replace(find_t, rep_t)
            for label, name in PERSON_FILLS:
                if label in new_t and name not in new_t:
                    new_t = new_t.rstrip('\r\n\x07') + ' ' + name + '\x07'
            if 'MSSV:' in new_t and '2387700060' not in new_t:
                new_t = 'MSSV: 2387700060\tLớp: 23DATA1\x07'
            if new_t != t:
                cell.Range.Text = new_t
                print(f"  [cell] {repr(new_t[:70])}")

# ── Fix tab stop for Ngành / Chuyên ngành lines ──────────────
# "Chuyên ngành: " ở 13pt TNR ≈ 112pt rộng → tab stop ở 130pt
# ClearAll() xóa default tab stops rồi set 1 custom stop duy nhất
wdAlignTabLeft = 0
TAB_POS = 130   # points — vừa đủ sau "Chuyên ngành: "
for para in doc.Paragraphs:
    t = para.Range.Text
    if t.startswith('Chuyên ngành:'):
        # Remove tab char — Final7 confirmed "Chuyên ngành:" uses space (not tab)
        # Also collapse multiple spaces into one so we don't get double space
        if '\t' in t:
            import re
            cleaned = re.sub(r':\s+', ': ', t.replace('\t', ' '), count=1)
            para.Range.Text = cleaned
            print(f"  Removed tab from: {repr(t[:40])}")
        # Reset indent to 0 (match manually-fixed Final7)
        para.Format.LeftIndent = 0
        para.Format.FirstLineIndent = 0
        para.TabStops.ClearAll()
        para.TabStops.Add(Position=TAB_POS, Alignment=wdAlignTabLeft, Leader=0)
        print(f"  TabStop {TAB_POS}pt set: Chuyen nganh")
    elif t.startswith('Ngành:'):
        # Keep tab char — Final7 confirmed "Ngành:" uses tab at 130pt
        # Reset indent to 0 (match manually-fixed Final7)
        para.Format.LeftIndent = 0
        para.Format.FirstLineIndent = 0
        para.TabStops.ClearAll()
        para.TabStops.Add(Position=TAB_POS, Alignment=wdAlignTabLeft, Leader=0)
        print(f"  TabStop {TAB_POS}pt set: Nganh")

doc.SaveAs2(cover_out, FileFormat=16)
doc.Close(False)
print(f"Cover saved: {cover_out}")

# ============================================================
# STEP 2: Open cover, add SECTION BREAK, clear section 2 border,
#         then append main report
# ============================================================
print("\nOpening cover to add section break...")
cover = word.Documents.Open(cover_out)

# Go to end and insert a "Next Page" section break
end_rng = cover.Range()
end_rng.Collapse(0)          # collapse to end
end_rng.InsertBreak(3)       # 3 = wdSectionBreakNextPage
print(f"Sections after break: {cover.Sections.Count}")

# Remove border from section 2 (which will hold the report content)
if cover.Sections.Count >= 2:
    sec2 = cover.Sections(2)
    for b in sec2.Borders:
        b.LineStyle = 0      # wdLineStyleNone = 0
    print("Border cleared from section 2")

# Append main report at the end (now in section 2)
end_rng = cover.Range()
end_rng.Collapse(0)
end_rng.InsertFile(report_in, '', False, False, False)

print(f"Total sections after append: {cover.Sections.Count}")

# Make sure all sections except 1 have no border
for i in range(2, cover.Sections.Count + 1):
    for b in cover.Sections(i).Borders:
        b.LineStyle = 0
    print(f"  Border cleared: section {i}")

cover.SaveAs2(final_out, FileFormat=16)
cover.Close(False)

word.Quit()
print(f"\nDONE! → {final_out}")
