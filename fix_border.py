import win32com.client
import os

word = win32com.client.Dispatch('Word.Application')
word.Visible = False

final_out = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\Báo cáo\BaoCao_DACS_TranDuyThai_Final.docx'

print("Opening Final file...")
doc = word.Documents.Open(final_out)

sec = doc.Sections(1)
borders = sec.Borders

# Print current AppliesTo value
print(f"Current AppliesTo: {borders.AppliesTo}")
# 0 = wdBorderApplyToAllPages
# 1 = wdBorderApplyToFirstPage
# 2 = wdBorderApplyToOtherPages (all except first)

# Set border to apply to FIRST PAGE ONLY
borders.AppliesTo = 1   # wdBorderApplyToFirstPage

print(f"New AppliesTo: {borders.AppliesTo}")
print("Border now applies to first page only.")

doc.Save()
doc.Close(False)
word.Quit()
print("DONE!")
