import win32com.client
import os

word = win32com.client.Dispatch('Word.Application')
word.Visible = False

path = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\Báo cáo\BaoCao_DACS_TranDuyThai_Final2.docx'
doc = word.Documents.Open(path)

print(f"Sections: {doc.Sections.Count}")
print(f"Pages: {doc.ComputeStatistics(2)}")  # wdStatisticPages=2

for i in range(1, doc.Sections.Count + 1):
    sec = doc.Sections(i)
    borders_on = [b.LineStyle for b in sec.Borders if b.LineStyle != 0]
    start_pg = sec.Range.Information(3)   # wdActiveEndPageNumber
    print(f"  Section {i}: border_styles={borders_on}, start_page≈{start_pg}")

# Now fix: remove borders from ALL sections except 1
print("\nFixing: remove border from sections 2+...")
for i in range(2, doc.Sections.Count + 1):
    for b in doc.Sections(i).Borders:
        b.LineStyle = 0
    print(f"  Cleared section {i}")

# Also try setting the section 1 border AppliesTo = first page only via macro
# Run a Word macro to set AppliesTo
macro_code = """
Sub FixBorder()
    With ActiveDocument.Sections(1).Borders
        .AppliesTo = wdBorderApplyToFirstPage
    End With
End Sub
"""
# Add the macro
try:
    vb = doc.VBProject.VBComponents.Add(1)  # 1 = vbext_ct_StdModule
    vb.CodeModule.AddFromString(macro_code)
    word.Application.Run("FixBorder")
    doc.VBProject.VBComponents.Remove(vb)
    print("AppliesTo = FirstPage set via macro")
except Exception as e:
    print(f"Macro approach failed: {e}")
    print("Trying direct approach...")
    # Try direct attribute set
    try:
        doc.Sections(1).Borders.AppliesTo = 1
        print("Direct set worked")
    except Exception as e2:
        print(f"Direct also failed: {e2}")

doc.Save()
doc.Close(False)
word.Quit()
print("Done!")
