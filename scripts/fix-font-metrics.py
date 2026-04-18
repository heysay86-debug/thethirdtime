"""
PaperlogyHan 폰트의 DroidSans 병합 글리프 메트릭을 Paperlogy 원본에 맞춤.

문제: DroidSans 글리프 advance=900 vs Paperlogy 원본 advance=792
결과: 글자 폭이 달라 PDF에서 비뚤거림

해결: DroidSans 글리프의 좌표를 축소·중앙정렬하여 advance=792에 맞춤
"""

from fontTools.ttLib import TTFont
import os, glob

FONTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'fonts')
TARGET_ADVANCE = 792

# DroidSans에서 온 글자들
DROID_CHARS = list('戊庚壬癸丑寅卯辰巳酉戌亥')

def fix_font(font_path: str):
    font = TTFont(font_path)
    hmtx = font['hmtx']
    glyf_table = font['glyf']
    cmap = font.getBestCmap()
    fixed = 0

    for ch in DROID_CHARS:
        cp = ord(ch)
        if cp not in cmap:
            continue
        gname = cmap[cp]
        adv, lsb = hmtx[gname]
        if adv == TARGET_ADVANCE:
            continue

        glyph = glyf_table[gname]
        scale = TARGET_ADVANCE / adv

        if glyph.isComposite():
            # 컴포지트: 컴포넌트 오프셋만 스케일
            for comp in glyph.components:
                comp.x = int(comp.x * scale)
            glyph.recalcBounds(glyf_table)
        elif glyph.numberOfContours > 0 and hasattr(glyph, 'coordinates'):
            coords = list(glyph.coordinates)
            xMin = glyph.xMin
            xMax = glyph.xMax
            glyph_w = xMax - xMin
            new_w = glyph_w * scale
            offset = (TARGET_ADVANCE - new_w) / 2

            new_coords = []
            for x, y in coords:
                new_x = int((x - xMin) * scale + offset)
                new_coords.append((new_x, y))
            glyph.coordinates = type(glyph.coordinates)(new_coords)
            glyph.recalcBounds(glyf_table)

        hmtx[gname] = (TARGET_ADVANCE, glyph.xMin if hasattr(glyph, 'xMin') and glyph.numberOfContours > 0 else 0)
        fixed += 1

    if fixed:
        font.save(font_path)
        print(f'  {fixed}자 수정 → {os.path.basename(font_path)}')
    else:
        print(f'  변경 없음 → {os.path.basename(font_path)}')
    font.close()

if __name__ == '__main__':
    files = sorted(glob.glob(os.path.join(FONTS_DIR, 'PaperlogyHan-*.ttf')))
    print(f'대상: {"".join(DROID_CHARS)} → advance {TARGET_ADVANCE}')
    for f in files:
        fix_font(f)
    print('완료')
