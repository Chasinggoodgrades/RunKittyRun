#!/usr/bin/env python3
"""Generates the Shop UI theme textures (TGA, 32-bit, uncompressed) into source.w3x/war3mapImported.

Run from the repo root:  python3 Scripts/generate_shop_theme.py
Needs Pillow. Output files are prefixed Shop_ and are registered in war3map.imp by register_shop_theme.py.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

OUT = os.path.join("source.w3x", "war3mapImported")
SS = 4  # supersampling for smooth edges


def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))


def vgrad(w, h, top, bottom):
    col = Image.new("RGBA", (1, h))
    for y in range(h):
        col.putpixel((0, y), lerp(top, bottom, y / max(1, h - 1)))
    return col.resize((w, h))


def rr_mask(w, h, r, inset=0):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [inset, inset, w - 1 - inset, h - 1 - inset], radius=max(0, r - inset), fill=255)
    return m


def finish(img, name):
    img = img.resize((img.width // SS, img.height // SS), Image.LANCZOS)
    img.save(os.path.join(OUT, name), format="TGA")
    print("wrote", name, img.size)


def panel(name, w, h, r, top, bottom, border, border_w, inner=None, inner_w=0, gloss=0):
    W, H = w * SS, h * SS
    R = r * SS
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    outer = rr_mask(W, H, R)
    # border
    img.paste(vgrad(W, H, *border) if isinstance(border[0], tuple) else border, (0, 0), outer)
    # fill
    bw = border_w * SS
    fill = vgrad(W, H, top, bottom)
    img.paste(fill, (0, 0), rr_mask(W, H, R, bw))
    # inner line
    if inner and inner_w:
        iw = (border_w + 1) * SS
        ring = ImageChops.subtract(rr_mask(W, H, R, iw), rr_mask(W, H, R, iw + inner_w * SS))
        img.paste(Image.new("RGBA", (W, H), inner), (0, 0), ring)
    # soft top gloss
    if gloss:
        g = Image.new("L", (W, H), 0)
        ImageDraw.Draw(g).rounded_rectangle([bw, bw, W - 1 - bw, H // 2], radius=max(0, R - bw), fill=gloss)
        g = g.filter(ImageFilter.GaussianBlur(H / 18))
        g = ImageChops.multiply(g, rr_mask(W, H, R, bw))
        img.paste(Image.new("RGBA", (W, H), (255, 255, 255, 255)), (0, 0), g)
    finish(img, name)


def ring(name, w, h, r, color, width, glow, glow_alpha=140, fill_alpha=0, fill_color=None):
    """Transparent-centre frame with an outer glow (used for slot hover / selection)."""
    W, H = w * SS, h * SS
    R = r * SS
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    mask = ImageChops.subtract(rr_mask(W, H, R, 2 * SS), rr_mask(W, H, R, (2 + width) * SS))
    gl = mask.filter(ImageFilter.GaussianBlur(glow * SS))
    gl = gl.point(lambda p: min(255, int(p * glow_alpha / 255 * 2)))
    base.paste(Image.new("RGBA", (W, H), color[:3] + (255,)), (0, 0), gl)
    base.paste(Image.new("RGBA", (W, H), color), (0, 0), mask)
    if fill_alpha:
        base.paste(Image.new("RGBA", (W, H), (fill_color or color)[:3] + (255,)), (0, 0),
                   rr_mask(W, H, R, (2 + width) * SS).point(lambda p: p * fill_alpha // 255))
    finish(base, name)


def divider(name, w, h, color):
    W, H = w * SS, h * SS
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = img.load()
    for x in range(W):
        t = x / (W - 1)
        a = int(255 * (1 - abs(t * 2 - 1)) ** 0.7)
        for y in range(H // 2 - SS, H // 2 + SS):
            px[x, y] = color[:3] + (a,)
    finish(img, name)


def main():
    if not os.path.isdir(OUT):
        sys.exit("run from the repo root (source.w3x/war3mapImported not found)")

    gold_top, gold_bot = hexc("#e6c36a"), hexc("#7a5a1c")

    # Window: deep navy with a gold bevel
    panel("Shop_Window.tga", 512, 256, 18, hexc("#1b2233"), hexc("#0a0d14"), (gold_top, gold_bot), 4,
          inner=hexc("#05070b", 200), inner_w=2, gloss=26)
    # Same window for the taller Music frame and the squarer Rewards frame (no stretched corners)
    panel("Shop_WindowTall.tga", 256, 460, 18, hexc("#1b2233"), hexc("#0a0d14"), (gold_top, gold_bot), 4,
          inner=hexc("#05070b", 200), inner_w=2, gloss=26)
    panel("Shop_WindowSquare.tga", 400, 480, 18, hexc("#1b2233"), hexc("#0a0d14"), (gold_top, gold_bot), 4,
          inner=hexc("#05070b", 200), inner_w=2, gloss=26)
    # Inset panels
    panel("Shop_Panel.tga", 256, 128, 10, hexc("#121722", 238), hexc("#0a0d14", 242),
          (hexc("#3b465e"), hexc("#222a3b")), 2, inner=(255, 255, 255, 14), inner_w=1)
    # Header band
    panel("Shop_Header.tga", 512, 48, 12, hexc("#4a3813"), hexc("#1c1507"), (gold_top, gold_bot), 3,
          inner=(255, 255, 255, 30), inner_w=1, gloss=60)
    # Tooltip background
    panel("Shop_Tooltip.tga", 128, 64, 8, hexc("#161c2a", 250), hexc("#0b0e16", 250),
          (hexc("#c9a24a"), hexc("#6b5018")), 2, inner=(255, 255, 255, 20), inner_w=1)
    # Item slots
    panel("Shop_Slot.tga", 64, 64, 9, hexc("#202839"), hexc("#10141e"),
          (hexc("#56627f"), hexc("#2a3247")), 2, inner=(0, 0, 0, 120), inner_w=1)
    ring("Shop_SlotHover.tga", 64, 64, 9, (190, 225, 255, 255), 4, 0, glow_alpha=0, fill_alpha=100)
    ring("Shop_SlotSelected.tga", 64, 64, 9, (255, 214, 102, 255), 3, 3, glow_alpha=200, fill_alpha=22)
    # Divider
    divider("Shop_Divider.tga", 256, 8, hexc("#d9b45a"))


if __name__ == "__main__":
    main()
