import sys
import os
import html

# Add skill path to sys.path
sys.path.append(r'C:\Users\BDTG\.gemini\skills\docx-official')

from scripts.document import Document, DocxXMLEditor

def xml_escape(text):
    return html.escape(text).replace("'", "&apos;").replace('"', "&quot;")

doc = Document('unpacked_docx', author="Trần Duy Thái", initials="TDT")
xml_editor = doc["word/document.xml"]

# 1. Update Project Title (NEW TITLE)
new_title = "MÔ PHỎNG VÀ DỰ BÁO LÂY LAN MÃ ĐỘC TRÊN MẠNG NỘI BỘ DỰA TRÊN MÔ HÌNH SIR HYBRID SYMBOLIC"
title_text = xml_escape(new_title)
title_para = xml_editor.get_node(tag="w:p", contains="T&#234;n &#273;&#7873; t&#224;i")
runs = title_para.getElementsByTagName("w:r")
found = False
for r in runs:
    t_tags = r.getElementsByTagName("w:t")
    for t in t_tags:
        if t.firstChild and t.firstChild.nodeValue:
            if "ghi IN HOA" in t.firstChild.nodeValue or "MÔ PHỎNG" in t.firstChild.nodeValue:
                xml_editor.replace_node(r, f'<w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>{title_text}</w:t></w:r>')
                found = True
                break
    if found: break

# 1.1 Update Theme (Chủ đề)
try:
    theme_t = xml_editor.get_node(tag="w:t", contains="Thuộc chủ đề:")
    # Check if already has value
    p = theme_t.parentNode.parentNode
    if "Malware" not in p.toxml():
        xml_editor.insert_after(theme_t.parentNode, f'<w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve"> Phát hiện mã độc (Malware)</w:t></w:r>')
except: pass

# 2. Update Student Info
# Student 1 Name
name_para = xml_editor.get_node(tag="w:p", attrs={"w14:paraId": "0000000F"})
runs = name_para.getElementsByTagName("w:r")
for r in runs[1:]: 
    r.parentNode.removeChild(r)
xml_editor.insert_after(runs[0], f'<w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>{xml_escape("Trần Duy Thái")}</w:t></w:r>')

# Student 1 MSSV
mssv_para = xml_editor.get_node(tag="w:p", attrs={"w14:paraId": "00000010"})
runs = mssv_para.getElementsByTagName("w:r")
for r in runs[1:]: 
    r.parentNode.removeChild(r)
xml_editor.insert_after(runs[0], f'<w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>2387700060</w:t></w:r>')

# Student 1 Email/Phone
contact_para = xml_editor.get_node(tag="w:p", attrs={"w14:paraId": "00000011"})
runs = list(contact_para.getElementsByTagName("w:r"))
for r in runs:
    t_tags = r.getElementsByTagName("w:t")
    for t in t_tags:
        if t.firstChild and t.firstChild.nodeValue:
            val = t.firstChild.nodeValue
            if "Email:" in val:
                xml_editor.insert_after(r, f'<w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t> normalprojectmain@gmail.com</w:t></w:r>')
            if "tho" in val or "Điện thoại:" in val:
                xml_editor.insert_after(r, f'<w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t> 0396769105</w:t></w:r>')

# 3. Delete Student 2
for pid in ["00000012", "00000013", "00000014", "00000015"]:
    try:
        p = xml_editor.get_node(tag="w:p", attrs={"w14:paraId": pid})
        p.parentNode.removeChild(p)
    except: pass

doc.save(validate=False)
