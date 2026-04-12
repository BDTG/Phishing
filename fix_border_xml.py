import zipfile, shutil, os

src  = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\Báo cáo\BaoCao_DACS_TranDuyThai_Final10.docx'
dest = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\Báo cáo\BaoCao_DACS_TranDuyThai_Final11.docx'

shutil.copy2(src, dest)

# Read document.xml
with zipfile.ZipFile(dest, 'r') as z:
    xml = z.read('word/document.xml').decode('utf-8')
    all_files = z.namelist()

# Add w:display="firstPage" to <w:pgBorders>
# This makes the border appear on the first page of the section only
old = '<w:pgBorders>'
new = '<w:pgBorders w:display="firstPage">'

if old in xml:
    xml_fixed = xml.replace(old, new, 1)  # Only first occurrence
    print(f"✓ Replaced '<w:pgBorders>' → '<w:pgBorders w:display=\"firstPage\">'")
else:
    print("✗ <w:pgBorders> not found — check XML manually")
    xml_fixed = xml

# Write back to zip (rebuild zip with modified document.xml)
import tempfile
tmp = dest + '.tmp.zip'
with zipfile.ZipFile(dest, 'r') as zin:
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.namelist():
            if item == 'word/document.xml':
                zout.writestr(item, xml_fixed.encode('utf-8'))
            else:
                zout.writestr(item, zin.read(item))

os.replace(tmp, dest)
print(f"✓ Saved: {dest}")
