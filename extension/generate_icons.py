"""
generate_icons.py
Tạo 12 file PNG icon cho extension (4 trạng thái × 3 kích thước)
Không cần thư viện ngoài — dùng struct + zlib thuần Python
"""

import struct  # Đóng gói binary data (cho PNG format)
import zlib    # Nén dữ liệu (cho PNG IDAT chunk)
import os      # Xử lý đường dẫn file/folder

def create_png(width, height, color):
    """
    Tạo PNG đơn giản với màu shield + symbol
    @param width: Chiều rộng icon (pixel)
    @param height: Chiều cao icon (pixel)
    @param color: 'green' | 'yellow' | 'red' | 'gray'
    @return: bytes — PNG data
    """
    # Mapping màu sắc theo trạng thái
    colors = {
        'green':  {'bg': (34, 197, 94), 'icon': (255, 255, 255)},   # Safe
        'yellow': {'bg': (245, 158, 11), 'icon': (255, 255, 255)},  # Warning
        'red':    {'bg': (239, 68, 68), 'icon': (255, 255, 255)},   # Block
        'gray':   {'bg': (107, 114, 128), 'icon': (255, 255, 255)}, # Default
    }
    bg = colors.get(color, colors['gray'])['bg']     # Màu nền
    icon = colors.get(color, colors['gray'])['icon'] # Màu icon (checkmark/X/question)

    # Tạo image data (RGBA — Red, Green, Blue, Alpha)
    pixels = []
    cx, cy = width / 2, height / 2 # Tâm hình tròn
    r = width * 0.35 # Bán kính shield

    # Duyệt qua từng pixel
    for y in range(height):
        row = []
        for x in range(width):
            # Kiểm tra pixel có nằm trong shield shape không
            dx = x - cx
            dy = y - cy
            # Shield hit test (đơn giản hóa)
            if dy < -r * 0.5:
                if abs(dx) > r * 0.8 * (1 - (-dy - r * 0.5) / (r * 0.5)):
                    row.extend([0, 0, 0, 0]) # Ngoài shield → transparent
                    continue
            elif dy > r * 0.2:
                if abs(dx) > r * 0.8 * (1 - (dy - r * 0.2) / (r * 0.8)):
                    row.extend([0, 0, 0, 0]) # Ngoài shield → transparent
                    continue

            # Trong shield → tô màu nền
            row.extend([*bg, 255]) # RGBA: bg + alpha=255 (opaque)
        pixels.append(bytes(row))

    # Tạo PNG chunks theo chuẩn PNG specification
    def chunk(chunk_type, data):
        """Tạo 1 PNG chunk: length + type + data + CRC"""
        c = chunk_type + data
        # 4 bytes length + chunk data + 4 bytes CRC
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    # PNG signature (8 bytes bắt buộc)
    png = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk — Image Header (thông tin ảnh)
    # Width, Height, Bit depth=8, Color type=6 (RGBA), Compression=0, Filter=0, Interlace=0
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))

    # IDAT chunk — Image Data (pixel data nén)
    raw = b''
    for row in pixels:
        raw += b'\x00' + row # Filter type 0 (None) + row data
    png += chunk(b'IDAT', zlib.compress(raw)) # Nén với zlib

    # IEND chunk — Image End (kết thúc)
    png += chunk(b'IEND', b'')

    return png

# ──────────────────────────────────────────────────────────────
# MAIN — Tạo tất cả icons
# ──────────────────────────────────────────────────────────────

# Mapping trạng thái → màu
states = {
    'safe': 'green',
    'warning': 'yellow',
    'block': 'red',
    'default': 'gray',
}

# Tạo thư mục icons
icon_dir = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(icon_dir, exist_ok=True)

# Tạo 12 file PNG (4 trạng thái × 3 kích thước)
for name, color in states.items():
    for size in [16, 32, 64]:
        png_data = create_png(size, size, color)
        filepath = os.path.join(icon_dir, f'icon_{name}_{size}.png')
        with open(filepath, 'wb') as f:
            f.write(png_data)
        print(f'✓ Created {filepath} ({len(png_data)} bytes)')

print(f'\n✓ Generated {len(states) * 3} icon files in {icon_dir}')
