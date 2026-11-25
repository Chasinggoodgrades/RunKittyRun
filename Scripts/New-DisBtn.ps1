<#
Generates the greyed DISBTN icon for a custom BTN icon in source.w3x/war3mapImported.
Usage: powershell -NoProfile -ExecutionPolicy Bypass -File Scripts\New-DisBtn.ps1 -Name ChainedRing [-Preview]
Output: source.w3x/ReplaceableTextures/CommandButtonsDisabled/DISBTN<Name>.blp (64x64 paletted BLP1, sepia, no border).
#>
param(
    [Parameter(Mandatory)][string]$Name,
    [string]$OutDir,
    [switch]$Preview
)

$ErrorActionPreference = 'Stop'
$root = Join-Path (Split-Path $PSScriptRoot -Parent) 'source.w3x'
if (-not $OutDir) { $OutDir = Join-Path $root 'ReplaceableTextures\CommandButtonsDisabled' }
$Name = $Name -replace '^BTN', '' -replace '\.blp$', ''
$src = Join-Path $root "war3mapImported\BTN$Name.blp"
if (-not (Test-Path $src)) { throw "Not found: $src" }

Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.IO;
public static class BlpWriter {
    public static byte[] BuildPalette(int[] px) {
        var boxes = new List<List<int>>();
        boxes.Add(new List<int>(px));
        while (boxes.Count < 256) {
            int best = -1, bestRange = 0, bestCh = 0;
            for (int i = 0; i < boxes.Count; i++) {
                for (int ch = 0; ch < 3; ch++) {
                    int mn = 255, mx = 0, sh = 16 - ch * 8;
                    foreach (int c in boxes[i]) { int v = (c >> sh) & 255; if (v < mn) mn = v; if (v > mx) mx = v; }
                    if (mx - mn > bestRange) { bestRange = mx - mn; best = i; bestCh = ch; }
                }
            }
            if (best < 0) break;
            int shift = 16 - bestCh * 8;
            var box = boxes[best];
            box.Sort((a, b) => ((a >> shift) & 255).CompareTo((b >> shift) & 255));
            int half = box.Count / 2;
            var left = box.GetRange(0, half); var right = box.GetRange(half, box.Count - half);
            boxes[best] = left; boxes.Add(right);
        }
        var pal = new byte[1024];
        for (int i = 0; i < boxes.Count; i++) {
            long r = 0, g = 0, b = 0; foreach (int c in boxes[i]) { r += (c >> 16) & 255; g += (c >> 8) & 255; b += c & 255; }
            int n = Math.Max(1, boxes[i].Count);
            pal[i * 4] = (byte)(b / n); pal[i * 4 + 1] = (byte)(g / n); pal[i * 4 + 2] = (byte)(r / n); pal[i * 4 + 3] = 255;
        }
        return pal;
    }
    static byte Nearest(byte[] pal, int c) {
        int r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, best = 0, bd = int.MaxValue;
        for (int i = 0; i < 256; i++) {
            int dr = pal[i * 4 + 2] - r, dg = pal[i * 4 + 1] - g, db = pal[i * 4] - b;
            int d = dr * dr + dg * dg + db * db; if (d < bd) { bd = d; best = i; }
        }
        return (byte)best;
    }
    public static void Write(string path, int[] px, int size) {
        var pal = BuildPalette(px);
        var levels = new List<byte[]>();
        int[] cur = px; int s = size;
        while (true) {
            var idx = new byte[s * s];
            for (int i = 0; i < idx.Length; i++) idx[i] = Nearest(pal, cur[i]);
            levels.Add(idx);
            if (s == 1) break;
            int ns = s / 2; var next = new int[ns * ns];
            for (int y = 0; y < ns; y++) for (int x = 0; x < ns; x++) {
                int r = 0, g = 0, b = 0;
                for (int dy = 0; dy < 2; dy++) for (int dx = 0; dx < 2; dx++) { int c = cur[(y * 2 + dy) * s + x * 2 + dx]; r += (c >> 16) & 255; g += (c >> 8) & 255; b += c & 255; }
                next[y * ns + x] = ((r / 4) << 16) | ((g / 4) << 8) | (b / 4);
            }
            cur = next; s = ns;
        }
        using (var ms = new MemoryStream()) using (var w = new BinaryWriter(ms)) {
            w.Write(new byte[] { 0x42, 0x4C, 0x50, 0x31 });
            w.Write(1); w.Write(0); w.Write(size); w.Write(size); w.Write(5); w.Write(1);
            int off = 156 + 1024;
            for (int i = 0; i < 16; i++) { if (i < levels.Count) { w.Write(off); off += levels[i].Length; } else w.Write(0); }
            for (int i = 0; i < 16; i++) w.Write(i < levels.Count ? levels[i].Length : 0);
            w.Write(pal);
            foreach (var l in levels) w.Write(l);
            File.WriteAllBytes(path, ms.ToArray());
        }
    }
}
"@

function Read-Blp($path) {
    $b = [IO.File]::ReadAllBytes($path)
    $content = [BitConverter]::ToUInt32($b, 4)
    $w = [int][BitConverter]::ToUInt32($b, 12); $h = [int][BitConverter]::ToUInt32($b, 16)
    $off0 = [BitConverter]::ToUInt32($b, 28); $size0 = [BitConverter]::ToUInt32($b, 92)
    if ($content -eq 1) {
        $bmp = New-Object System.Drawing.Bitmap $w, $h
        for ($y = 0; $y -lt $h; $y++) { for ($x = 0; $x -lt $w; $x++) {
            $i = $b[$off0 + $y * $w + $x]
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $b[156 + $i * 4 + 2], $b[156 + $i * 4 + 1], $b[156 + $i * 4]))
        } }
        return $bmp
    }
    # JPEG content: shared header + per-mip data
    $hl = [BitConverter]::ToUInt32($b, 156)
    $jpg = New-Object byte[] ($hl + $size0)
    [Array]::Copy($b, 160, $jpg, 0, $hl)
    [Array]::Copy($b, $off0, $jpg, $hl, $size0)
    $img = [System.Drawing.Image]::FromStream((New-Object IO.MemoryStream (, $jpg)))
    return (New-Object System.Drawing.Bitmap $img)
}

$btn = Read-Blp $src
$S = $btn.Width
if ($btn.Height -ne $S -or ($S -band ($S - 1)) -ne 0) { throw "BTN must be square with a power-of-two size, got $($btn.Width)x$($btn.Height)" }

# Background colour of the stock-style disabled icons (DISBTNArcaniteNightRing corner).
$bgR = 67; $bgG = 51; $bgB = 41
$border = 4; $fade = 6; $sat = 0.2
$px = New-Object 'int[]' ($S * $S)
for ($y = 0; $y -lt $S; $y++) { for ($x = 0; $x -lt $S; $x++) {
    $c = $btn.GetPixel($x, $y)
    $lum = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
    $r = ($lum + ($c.R - $lum) * $sat) * 1.25 + 12
    $g = ($lum + ($c.G - $lum) * $sat) * 0.95 + 6
    $b = ($lum + ($c.B - $lum) * $sat) * 0.70
    $d = [Math]::Min([Math]::Min($x, $S - 1 - $x), [Math]::Min($y, $S - 1 - $y))
    $t = [Math]::Max(0.0, [Math]::Min(1.0, ($d - $border) / $fade))
    $r = $r * $t + $bgR * (1 - $t); $g = $g * $t + $bgG * (1 - $t); $b = $b * $t + $bgB * (1 - $t)
    $px[$y * $S + $x] = ([int][Math]::Min(255, $r) -shl 16) -bor ([int][Math]::Min(255, $g) -shl 8) -bor [int][Math]::Min(255, $b)
} }

New-Item -ItemType Directory -Force $OutDir | Out-Null
$out = Join-Path $OutDir "DISBTN$Name.blp"
[BlpWriter]::Write($out, $px, $S)
"Wrote $out ($((Get-Item $out).Length) bytes)"

if ($Preview) {
    $dis = Read-Blp $out
    $sheet = New-Object System.Drawing.Bitmap 384, 192
    $gfx = [System.Drawing.Graphics]::FromImage($sheet)
    $gfx.InterpolationMode = 'NearestNeighbor'; $gfx.PixelOffsetMode = 'Half'
    $gfx.DrawImage($btn, 0, 0, 192, 192)
    $gfx.DrawImage($dis, 192, 0, 192, 192)
    $png = Join-Path $env:TEMP "DISBTN$Name.preview.png"
    $sheet.Save($png)
    "Preview (BTN | DISBTN): $png"
}
