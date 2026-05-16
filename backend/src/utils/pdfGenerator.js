// ── DEPENDENCIES ─────────────────────────────────────────────────────────────
const PDFDocument = require('pdfkit');
const path        = require('path');
const fs2         = require('fs');
const { generateQRCodeDataURL } = require('./qrcode');

// ── FONT PATHS ────────────────────────────────────────────────────────────────
const FONTS_DIR  = path.join(__dirname, 'fonts');
const FONT_ARAB_R = path.join(FONTS_DIR, 'TraditionalArabic.ttf');
const FONT_ARAB_B = path.join(FONTS_DIR, 'TraditionalArabicBold.ttf');
const HAS_ARAB    = fs2.existsSync(FONT_ARAB_R);

// ── FONT NAMES ────────────────────────────────────────────────────────────────
const F_REG       = 'Times-Roman';
const F_BOLD      = 'Times-Bold';
const F_ITAL      = 'Times-Italic';
const F_BOLD_ITAL = 'Times-BoldItalic';
const F_ARAB      = 'ArabFont';
const F_ARAB_BOLD = 'ArabFontBold';

// ── PAGE CONSTANTS ────────────────────────────────────────────────────────────
const ML = 57;   // margin left
const MR = 57;   // margin right
const MT = 35;   // margin top
const PW = 595.28;
const PH = 841.89;
const CW = PW - ML - MR;

// ── FONT SIZES ────────────────────────────────────────────────────────────────
const FS_ISI          = 11;
const FS_ARAB         = 14;
const LINE_GAP        = 2;
const FS_KOP_TINGKAT  = 10;
const FS_KOP_NAMA     = 16;
const FS_KOP_DAERAH   = 11;
const FS_KOP_ALAMAT   = 8.5;
const FS_KOP_KONTAK   = 7.5;

// ── COLOURS ───────────────────────────────────────────────────────────────────
const GREEN      = '#166534';
const LINK_COLOR = '#1a56db';
const TAB_W      = 24;

// ── ARABIC ───────────────────────────────────────────────────────────────────
let arabicReshaper;
try { arabicReshaper = require('arabic-reshaper'); } catch (_) {}

function reshapeArabic(t) {
  if (!t) return '';
  try {
    return (arabicReshaper ? arabicReshaper.convertArabic(t) : t)
      .split(' ').reverse().join(' ');
  } catch (_) { return t; }
}

function isArabic(s) {
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(s || '');
}

function registerArabFonts(doc) {
  if (!HAS_ARAB) return;
  try {
    doc.registerFont(F_ARAB, FONT_ARAB_R);
    doc.registerFont(F_ARAB_BOLD, fs2.existsSync(FONT_ARAB_B) ? FONT_ARAB_B : FONT_ARAB_R);
  } catch (_) {}
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function pickFont(b, i) {
  return b && i ? F_BOLD_ITAL : b ? F_BOLD : i ? F_ITAL : F_REG;
}

function dec(s) {
  return (s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function htmlToText(h) {
  if (!h) return '';
  return h
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<li>/gi, '* ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractAlign(t) {
  if (!t) return null;
  // inline style: text-align: center
  const m = t.match(/text-align\s*:\s*(left|center|right|justify)/i);
  if (m) return m[1].toLowerCase();
  // class: ql-align-center atau tiptap style
  const c = t.match(/ql-align-(left|center|right|justify)/i);
  if (c) return c[1].toLowerCase();
  // data attribute atau class lain
  const d = t.match(/\btext-(left|center|right|justify)\b/i);
  if (d) return d[1].toLowerCase();
  return null;
}

// ── INLINE PARSER ─────────────────────────────────────────────────────────────
function parseInline(html) {
  if (!html) return [{ text: '', b: false, i: false, u: false, link: null }];
  const segs = [];
  let bold = false, italic = false, uline = false, link = null;
  const stack = [];
  const parts = html.replace(/<br\s*\/?>/gi, '\n').split(/(<[^>]+>)/);

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('<')) {
      const isClose = part.startsWith('</');
      const tag = part.replace(/<\/?/, '').replace(/[\s>].*/, '').toLowerCase();
      if (!isClose) {
        stack.push({ bold, italic, uline, link });
        if (tag === 'strong' || tag === 'b') bold = true;
        else if (tag === 'em' || tag === 'i') italic = true;
        else if (tag === 'u') uline = true;
        else if (tag === 'a') {
          const hm = part.match(/href=["']([^"']+)["']/i);
          link = hm ? hm[1] : null;
          uline = true;
        }
      } else {
        if (stack.length) {
          const p = stack.pop();
          bold = p.bold; italic = p.italic; uline = p.uline; link = p.link;
        }
      }
    } else {
      const decoded = dec(part);
      const tabs = decoded.split('\t');
      for (let ti = 0; ti < tabs.length; ti++) {
        if (ti > 0) segs.push({ text: '\t', b: false, i: false, u: false, link: null, isTab: true });
        if (tabs[ti]) segs.push({ text: tabs[ti], b: bold, i: italic, u: uline, link, isTab: false });
      }
    }
  }
  return segs.length ? segs : [{ text: '', b: false, i: false, u: false, link: null }];
}

// ── RENDER HELPERS ────────────────────────────────────────────────────────────
function splitByNL(segs) {
  const lines = [[]];
  for (const seg of segs) {
    const parts = seg.text.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) lines.push([]);
      if (parts[i] || seg.isTab) lines[lines.length - 1].push({ ...seg, text: parts[i] });
    }
  }
  return lines;
}

function renderLine(doc, segs, x, y, maxW, align, defBold) {
  let curX = x;
  for (const seg of segs) {
    if (seg.isTab) { curX += TAB_W; continue; }
    if (!seg.text) continue;
    const font  = pickFont(seg.b || defBold, seg.i);
    const color = seg.link ? LINK_COLOR : '#000000';
    doc.font(font).fontSize(FS_ISI).fillColor(color);
    const rem = x + maxW - curX;
    if (rem < 5) break;
    const opts = { lineBreak: false, lineGap: LINE_GAP };
    if (seg.u || seg.link) opts.underline = true;
    if (seg.link) opts.link = seg.link;
    doc.text(seg.text, curX, y, { ...opts, width: rem });
    curX += doc.widthOfString(seg.text);
  }
  return y + FS_ISI * 1.45 + LINE_GAP;
}

function renderSegs(doc, segs, x, y, maxW, align, defBold) {
  if (!segs || !segs.length) return y;
  const allTxt = segs.map(s => s.text).join('');

  // Teks Arab — render sebagai blok center
  if (isArabic(allTxt) && HAS_ARAB) {
    const shaped = reshapeArabic(allTxt.replace(/\n/g, ' ').trim());
    doc.font(F_ARAB).fontSize(FS_ARAB).fillColor('#000000');
    doc.text(shaped, x, y, { width: maxW, align: 'center', lineGap: LINE_GAP });
    return doc.y + 4;
  }

  // Cek apakah semua segmen punya format yang sama (tidak ada mixed bold/italic/link)
  const hasFormatting = segs.some(s => s.b || s.i || s.u || s.link || s.isTab);

  if (!hasFormatting) {
    // Render sederhana — biarkan PDFKit handle word-wrap & align
    const txt = allTxt;
    doc.font(pickFont(defBold, false)).fontSize(FS_ISI).fillColor('#000000');
    doc.text(txt, x, y, { width: maxW, align: align || 'justify', lineGap: LINE_GAP });
    return doc.y + 2;
  }

  // Mixed format — render baris per baris, tiap baris pakai continued segments
  const lines = splitByNL(segs);
  for (const ln of lines) {
    if (!ln.length) { y += FS_ISI * 1.45; continue; }

    // Cek apakah baris ini semua satu format
    const lnHasFormat = ln.some(s => s.b || s.i || s.u || s.link || s.isTab);
    if (!lnHasFormat) {
      const txt = ln.map(s => s.text).join('');
      doc.font(pickFont(defBold, false)).fontSize(FS_ISI).fillColor('#000000');
      doc.text(txt, x, y, { width: maxW, align: align || 'justify', lineGap: LINE_GAP });
      y = doc.y + 2;
      continue;
    }

    // Untuk align center/right: PDFKit continued tidak support align dengan benar.
    // Render semua teks sebagai satu string dengan font dominan, lalu overlay bold/italic
    // dengan cara: cek apakah semua segmen punya bold yang sama
    const effectiveAlign = align || 'justify';
    if (effectiveAlign === 'center' || effectiveAlign === 'right') {
      // Ambil font dari segmen pertama yang punya teks
      const firstSeg = ln.find(s => s.text && !s.isTab);
      const dominantFont = firstSeg ? pickFont(firstSeg.b || defBold, firstSeg.i) : pickFont(defBold, false);
      const fullTxt = ln.filter(s => !s.isTab).map(s => s.text).join('');
      doc.font(dominantFont).fontSize(FS_ISI).fillColor('#000000');
      doc.text(fullTxt, x, y, { width: maxW, align: effectiveAlign, lineGap: LINE_GAP });
      y = doc.y + 2;
      continue;
    }

    // Untuk justify/left: render segment per segment dengan continued:true
    let isFirst = true;
    // Filter segmen yang punya teks
    const validSegs = ln.filter(s => !s.isTab && s.text);
    for (let si = 0; si < validSegs.length; si++) {
      const seg = validSegs[si];
      const font  = pickFont(seg.b || defBold, seg.i);
      const color = seg.link ? LINK_COLOR : '#000000';
      doc.font(font).fontSize(FS_ISI).fillColor(color);
      const isLast = si === validSegs.length - 1;
      const opts = {
        continued: !isLast,
        lineGap: LINE_GAP,
        width: maxW,
        align: effectiveAlign,
      };
      if (seg.u || seg.link) opts.underline = true;
      if (seg.link) opts.link = seg.link;
      if (isFirst) {
        doc.text(seg.text, x, y, opts);
        isFirst = false;
      } else {
        doc.text(seg.text, opts);
      }
    }
    y = doc.y + 2;
  }
  return y;
}

// ── HTML PARSER ───────────────────────────────────────────────────────────────
function parseParas(html, blocks) {
  // Tangkap p, h1-h6, div, li (dengan konteks ol/ul untuk numbering)
  const re = /<(p|h[1-6]|div)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let last = 0, m;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) {
      const between = html.slice(last, m.index);
      const t = htmlToText(between);
      if (t.trim()) blocks.push({ type: 'para', segs: parseInline(t), align: 'justify', bold: false });
    }
    const align  = extractAlign(m[2]) || 'justify';
    const isBold = /^h[1-6]$/i.test(m[1]);
    const segs   = parseInline(m[3]);
    const hasText = segs.some(s => s.text.trim());

    if (hasText) {
      blocks.push({ type: 'para', segs, align, bold: isBold });
    } else {
      // Paragraf kosong → baris kosong (spasi vertikal)
      blocks.push({ type: 'empty' });
    }
    last = m.index + m[0].length;
  }
  const rem = html.slice(last);
  if (rem.trim()) {
    const t = htmlToText(rem);
    if (t.trim()) blocks.push({ type: 'para', segs: parseInline(t), align: 'justify', bold: false });
  }
}

// ── LIST PARSER (ol/ul) ───────────────────────────────────────────────────────
// Konversi angka ke romawi
function toRoman(n) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

function getListPrefix(counter, listStyleType, isOrdered, bulletChar) {
  if (!isOrdered) return `${bulletChar || '•'} `;
  switch (listStyleType) {
    case 'upper-alpha': return `${String.fromCharCode(64 + counter)}. `;
    case 'lower-alpha': return `${String.fromCharCode(96 + counter)}. `;
    case 'upper-roman': return `${toRoman(counter)}. `;
    case 'lower-roman': return `${toRoman(counter).toLowerCase()}. `;
    default:            return `${counter}. `;
  }
}

function parseList(html, isOrdered) {
  const blocks = [];
  // Ambil listStyleType dari atribut ol
  let listStyleType = 'decimal';
  let bulletChar = '•';
  if (isOrdered) {
    const styleMatch = html.match(/style="[^"]*list-style-type:\s*([^;"]+)/i);
    const dataMatch  = html.match(/data-list-style="([^"]+)"/i);
    listStyleType = (styleMatch && styleMatch[1].trim()) || (dataMatch && dataMatch[1]) || 'decimal';
  } else {
    const bulletMatch = html.match(/data-bullet-char="([^"]+)"/i);
    bulletChar = (bulletMatch && bulletMatch[1]) || '•';
  }

  const liRe = /<li([^>]*)>([\s\S]*?)<\/li>/gi;
  let m;
  let counter = 1;
  while ((m = liRe.exec(html)) !== null) {
    const innerHtml = m[2];
    const hasNested = /<(ol|ul)/i.test(innerHtml);
    const textPart  = hasNested
      ? innerHtml.replace(/<(ol|ul)[\s\S]*?<\/\1>/gi, '').trim()
      : innerHtml;
    const segs   = parseInline(textPart);
    const prefix = getListPrefix(counter, listStyleType, isOrdered, bulletChar);
    const prefixSeg = { text: prefix, b: false, i: false, u: false, link: null };
    blocks.push({ type: 'listitem', segs: [prefixSeg, ...segs], align: 'left', bold: false, indent: 0, listStyleType });
    counter++;
    if (hasNested) {
      const nestedRe = /<(ol|ul)([\s\S]*?)<\/\1>/gi;
      let nm;
      while ((nm = nestedRe.exec(innerHtml)) !== null) {
        const nestedIsOrdered = nm[1].toLowerCase() === 'ol';
        const nestedBlocks = parseList(nm[0], nestedIsOrdered);
        nestedBlocks.forEach(b => { b.indent = (b.indent || 0) + 20; });
        blocks.push(...nestedBlocks);
      }
    }
  }
  return blocks;
}

function parseTable(html) {
  const headers = [], rows = [];
  // Deteksi tabel tanpa border
  const borderless = /data-borderless="true"/i.test(html);

  const thRe = /<th[^>]*>([\s\S]*?)<\/th>/gi;
  let m;
  while ((m = thRe.exec(html)) !== null)
    headers.push({
      blocks: parseHtml(m[1]),
      plain: htmlToText(m[1]),
      isHead: true,
    });
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  while ((m = trRe.exec(html)) !== null) {
    if (/<th/i.test(m[1])) continue;
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let td;
    const cells = [];
    while ((td = tdRe.exec(m[1])) !== null)
      cells.push({
        blocks: parseHtml(td[1]),
        plain: htmlToText(td[1]),
        align: extractAlign(td[0]) || 'left',
      });
    if (cells.length) rows.push(cells);
  }
  if (!headers.length && !rows.length) return null;
  return { type: 'table', headers, rows, borderless };
}

function parseHtml(html) {
  if (!html) return [{ type: 'empty' }];
  const blocks = [];

  // Regex untuk menangkap table, ol, ul, img secara berurutan
  const blockRe = /(<table[\s\S]*?<\/table>|<ol([^>]*)>([\s\S]*?)<\/ol>|<ul([^>]*)>([\s\S]*?)<\/ul>|<img[^>]*\/?>)/gi;
  let last = 0, m;

  while ((m = blockRe.exec(html)) !== null) {
    if (m.index > last) {
      parseParas(html.slice(last, m.index), blocks);
    }

    const tag = m[0].trim().toLowerCase();
    if (tag.startsWith('<table')) {
      const tbl = parseTable(m[0]);
      if (tbl) blocks.push(tbl);
    } else if (tag.startsWith('<ol')) {
      blocks.push(...parseList(m[0], true));
    } else if (tag.startsWith('<ul')) {
      blocks.push(...parseList(m[0], false));
    } else if (tag.startsWith('<img')) {
      // Ambil src dari tag img
      const srcMatch = m[0].match(/src="([^"]+)"/i);
      if (srcMatch) {
        blocks.push({ type: 'image', src: srcMatch[1] });
      }
    }

    last = m.index + m[0].length;
  }

  if (last < html.length) parseParas(html.slice(last), blocks);

  if (!blocks.length) blocks.push({ type: 'empty' });
  return blocks;
}

// ── BLOCK HEIGHT ESTIMATOR ────────────────────────────────────────────────────
function estimateBlockHeight(doc, block) {
  if (block.type === 'empty') return FS_ISI * 1.2;
  if (block.type === 'image') return 120; // estimasi tinggi gambar default

  if (block.type === 'table') {
    const { headers, rows } = block;
    const allRows = headers.length ? [headers, ...rows] : rows;
    if (!allRows.length) return 0;
    const numCols = Math.max(...allRows.map(r => r.length));
    const PADX = 4, PADY = 3;

    // Hitung lebar kolom berdasarkan lebar teks aktual
    try { doc.font(F_REG).fontSize(FS_ISI); } catch (_) {}
    const naturalW = Array(numCols).fill(0);
    for (const row of allRows) {
      for (let ci = 0; ci < numCols; ci++) {
        const plain = ((row[ci] && row[ci].plain) || '').trim();
        if (!plain) continue;
        const lines = plain.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const w = doc.widthOfString(trimmed) + PADX * 2 + 8;
            if (w > naturalW[ci]) naturalW[ci] = w;
          } catch (_) {}
        }
        if (naturalW[ci] < 24) naturalW[ci] = 24;
      }
    }
    const MAX_COL_E = CW * 0.70;
    const clampedWE = naturalW.map(w => Math.min(w, MAX_COL_E));
    const totalClampedE = clampedWE.reduce((a, b) => a + b, 0) || 1;
    const colW = clampedWE.map(w => (w / totalClampedE) * CW);

    let h = 0;
    for (let ri = 0; ri < allRows.length; ri++) {
      const row = allRows[ri];
      let rowH = FS_ISI + PADY * 2;
      for (let ci = 0; ci < numCols; ci++) {
        const cell = row[ci] || { plain: '', blocks: [] };
        const tw = colW[ci] - PADX * 2;
        const cellBlocks = cell.blocks || [];
        let cellH = PADY * 2;
        for (const cb of cellBlocks) {
          if (cb.type === 'empty') {
            cellH += FS_ISI * 1.2;
          } else if (cb.type === 'listitem') {
            // Hitung dengan hanging indent — lebar efektif = tw - lebar prefix
            const segs = cb.segs || [];
            const firstSeg = segs[0];
            const isPrefix = firstSeg && /^([•\-]|[A-Za-z]{1,5}\.|\d+\.|[IVXivx]+\.)\s$/.test(firstSeg.text);
            let txt, effectiveW;
            if (isPrefix) {
              try {
                doc.font(F_REG).fontSize(FS_ISI);
                const prefixW = doc.widthOfString(firstSeg.text);
                txt = segs.slice(1).map(s => s.text).join('');
                effectiveW = Math.max(tw - prefixW, 20);
              } catch (_) {
                txt = segs.map(s => s.text).join('');
                effectiveW = tw;
              }
            } else {
              txt = segs.map(s => s.text).join('');
              effectiveW = tw;
            }
            try {
              doc.font(F_REG).fontSize(FS_ISI);
              cellH += doc.heightOfString(txt || ' ', { width: effectiveW, lineGap: LINE_GAP }) + 2;
            } catch (_) { cellH += FS_ISI * 1.5; }
          } else if (cb.type === 'para') {
            const segs = cb.segs || [];
            const txt = segs.map(s => s.text).join('');
            try {
              doc.font(F_REG).fontSize(FS_ISI);
              cellH += doc.heightOfString(txt || ' ', { width: tw, lineGap: LINE_GAP }) + 2;
            } catch (_) { cellH += FS_ISI * 1.5; }
          } else {
            try {
              doc.font(F_REG).fontSize(FS_ISI);
              cellH += doc.heightOfString(cell.plain || '', { width: tw, lineGap: LINE_GAP }) + 2;
            } catch (_) { cellH += FS_ISI * 1.5; }
          }
        }
        if (cellBlocks.length === 0) {
          try {
            doc.font(F_REG).fontSize(FS_ISI);
            cellH += doc.heightOfString(cell.plain || '', { width: tw, lineGap: LINE_GAP });
          } catch (_) { cellH += FS_ISI * 1.5; }
        }
        if (cellH > rowH) rowH = cellH;
      }
      h += rowH;
    }
    return h + 6;
  }

  // para atau listitem
  const segs = block.segs || [];
  const allTxt = segs.map(s => s.text).join('');
  if (isArabic(allTxt)) return FS_ARAB * 1.8 + 4;
  const lines = splitByNL(segs);
  return lines.length * (FS_ISI * 1.45 + LINE_GAP);
}

// ── RENDER TABLE ──────────────────────────────────────────────────────────────
function renderTable(doc, table, x, startY) {
  const { headers, rows, borderless } = table;
  const allRows = headers.length ? [headers, ...rows] : rows;
  if (!allRows.length) return startY;
  const numCols = Math.max(...allRows.map(r => r.length));
  if (!numCols) return startY;
  const PADX = 4, PADY = 3;

  // ── Hitung lebar kolom berdasarkan lebar teks aktual ──────────────────────
  // Set font dulu sebelum mengukur agar widthOfString akurat
  doc.font(F_REG).fontSize(FS_ISI);

  // Ukur lebar baris terpanjang per kolom
  const naturalW = Array(numCols).fill(0);
  for (const row of allRows) {
    for (let ci = 0; ci < numCols; ci++) {
      const cell = row[ci] || { plain: '' };
      const plain = (cell.plain || '').trim();
      if (!plain) continue;
      const lines = plain.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const w = doc.widthOfString(trimmed) + PADX * 2 + 8;
          if (w > naturalW[ci]) naturalW[ci] = w;
        } catch (_) {}
      }
      if (naturalW[ci] < 24) naturalW[ci] = 24;
    }
  }

  // Batasi lebar maksimum setiap kolom agar tidak mendominasi
  // Kolom dengan konten panjang (list/paragraf) dibatasi max 70% CW
  const MAX_COL = CW * 0.70;
  const clampedW = naturalW.map(w => Math.min(w, MAX_COL));

  // Distribusi: scale proporsional agar total = CW
  const totalClamped = clampedW.reduce((a, b) => a + b, 0) || 1;
  const colW = clampedW.map(w => (w / totalClamped) * CW);

  // Hitung tinggi baris berdasarkan blocks di setiap sel
  function calcRowHeight(row, isHead) {
    let maxH = FS_ISI + PADY * 2;
    for (let ci = 0; ci < numCols; ci++) {
      const cell = row[ci] || { plain: '', blocks: [] };
      const tw = colW[ci] - PADX * 2;
      const cellBlocks = cell.blocks || [];
      let cellH = PADY * 2;
      for (const cb of cellBlocks) {
        if (cb.type === 'empty') {
          cellH += FS_ISI * 1.2;
        } else {
          const segs = cb.segs || [];
          const txt = segs.map(s => s.text).join('');
          const indent = cb.indent || 0;
          try {
            doc.font(isHead ? F_BOLD : F_REG).fontSize(FS_ISI);
            cellH += doc.heightOfString(txt || ' ', { width: tw - indent, lineGap: LINE_GAP }) + 2;
          } catch (_) { cellH += FS_ISI * 1.5; }
        }
      }
      if (cellBlocks.length === 0) {
        try {
          doc.font(isHead ? F_BOLD : F_REG).fontSize(FS_ISI);
          cellH += doc.heightOfString(cell.plain || '', { width: tw, lineGap: LINE_GAP });
        } catch (_) { cellH += FS_ISI * 1.5; }
      }
      if (cellH > maxH) maxH = cellH;
    }
    return maxH;
  }

  let Y = startY;
  for (let ri = 0; ri < allRows.length; ri++) {
    const row    = allRows[ri];
    const isHead = ri === 0 && headers.length > 0;
    const rowH   = calcRowHeight(row, isHead);

    // Background baris — tanpa shading

    // Render isi setiap sel
    let cellX = x;
    for (let ci = 0; ci < numCols; ci++) {
      const cW   = colW[ci];
      const cell = row[ci] || { plain: '', blocks: [], align: 'left' };
      const cellBlocks = cell.blocks || [];
      const cellAlign  = cell.align || 'left';
      const tw = cW - PADX * 2;
      let cellY = Y + PADY;

      if (cellBlocks.length > 0) {
        for (const cb of cellBlocks) {
          if (cb.type === 'empty') {
            cellY += FS_ISI * 1.2;
          } else if (cb.type === 'listitem') {
            const segs    = cb.segs || [];
            const firstSeg = segs[0];
            const isPrefix = firstSeg && /^([•\-]|[A-Za-z]{1,5}\.|\d+\.|[IVXivx]+\.)\s$/.test(firstSeg.text);

            if (isPrefix) {
              const prefix   = firstSeg.text;
              const restTxt  = segs.slice(1).map(s => s.text).join('');
              doc.font(isHead ? F_BOLD : F_REG).fontSize(FS_ISI);
              const prefixW  = doc.widthOfString(prefix);
              const textX2   = cellX + PADX + prefixW;
              const textW2   = tw - prefixW;              // Tulis prefix
              doc.fillColor('#000000').text(prefix, cellX + PADX, cellY, { width: prefixW + 2, lineBreak: false, lineGap: LINE_GAP });
              // Tulis teks konten dengan hanging indent
              if (restTxt) {
                doc.font(isHead ? F_BOLD : F_REG).fontSize(FS_ISI).fillColor('#000000');
                doc.text(restTxt, textX2, cellY, { width: textW2, align: 'justify', lineGap: LINE_GAP });
              }
              cellY = doc.y + 2;
            } else {
              const txt = segs.map(s => s.text).join('');
              doc.font(isHead ? F_BOLD : F_REG).fontSize(FS_ISI).fillColor('#000000');
              doc.text(txt, cellX + PADX, cellY, { width: tw, align: 'left', lineGap: LINE_GAP });
              cellY = doc.y + 2;
            }
          } else {
            // para — render dengan format inline
            const segs = cb.segs || [];
            const allTxt = segs.map(s => s.text).join('');
            if (isArabic(allTxt) && HAS_ARAB) {
              const shaped = reshapeArabic(allTxt.replace(/\n/g, ' ').trim());
              doc.font(F_ARAB).fontSize(FS_ARAB).fillColor('#000000');
              doc.text(shaped, cellX + PADX, cellY, { width: tw, align: 'center', lineGap: LINE_GAP });
              cellY = doc.y + 2;
            } else {
              const txt = allTxt;
              doc.font(isHead ? F_BOLD : F_REG).fontSize(FS_ISI).fillColor('#000000');
              doc.text(txt, cellX + PADX, cellY, { width: tw, align: cellAlign, lineGap: LINE_GAP });
              cellY = doc.y + 2;
            }
          }
        }
      } else {
        // Fallback: render plain text
        doc.font(isHead ? F_BOLD : F_REG).fontSize(FS_ISI).fillColor('#000000');
        doc.text(cell.plain || '', cellX + PADX, cellY, { width: tw, align: cellAlign, lineGap: LINE_GAP });
      }

      cellX += cW;
    }

    // Border baris — skip jika borderless
    if (!borderless) {
      doc.rect(x, Y, CW, rowH).strokeColor('#888888').lineWidth(0.5).stroke();
      let bx = x;
      for (let ci = 0; ci < numCols - 1; ci++) {
        bx += colW[ci];
        doc.moveTo(bx, Y).lineTo(bx, Y + rowH).strokeColor('#888888').lineWidth(0.5).stroke();
      }
    }
    Y += rowH;
  }
  return Y + 6;
}

// ── KOP SURAT (dipakai di setiap halaman) ─────────────────────────────────────
async function drawKopSurat(doc, organisasi, pageY) {
  // Support Railway volume mount path
  const BASE_UPLOAD = process.env.UPLOAD_DIR
    ? (process.env.UPLOAD_DIR.startsWith('/') ? process.env.UPLOAD_DIR : path.join(__dirname, '../../', process.env.UPLOAD_DIR))
    : path.join(__dirname, '../../uploads');

  const logoPath = organisasi.logoPath
    ? (organisasi.logoPath.startsWith('/uploads')
        ? path.join(BASE_UPLOAD, organisasi.logoPath.replace('/uploads', ''))
        : path.join(__dirname, '../../', organisasi.logoPath))
    : null;
  const hasLogo = logoPath && fs2.existsSync(logoPath);

  const tingkatan = organisasi.tingkatanOrg || 'Pimpinan Cabang';
  const namaOrg   = organisasi.namaOrg      || 'Fatayat Nahdlatul Ulama';
  const daerah    = organisasi.daerahOrg    || '';
  const alamat    = organisasi.alamat       || '';
  const telepon   = organisasi.telepon      || '';
  const email     = organisasi.email        || '';
  const website   = organisasi.website      || '';

  const logoMaxSize = 65;  // batas maksimal (lebar atau tinggi)
  const logoX       = ML;
  const textX       = hasLogo ? ML + logoMaxSize + 10 : ML;
  const textW       = hasLogo ? CW - logoMaxSize - 10  : CW;
  let   y           = pageY !== undefined ? pageY : MT;

  if (hasLogo) {
    try {
      // Baca dimensi asli gambar agar rasio terjaga
      const imgInfo = doc.openImage(logoPath);
      const imgW    = imgInfo.width  || logoMaxSize;
      const imgH    = imgInfo.height || logoMaxSize;
      const ratio   = imgW / imgH;

      let drawW, drawH;
      if (ratio >= 1) {
        // Landscape atau kotak — batasi lebar
        drawW = logoMaxSize;
        drawH = logoMaxSize / ratio;
      } else {
        // Portrait — batasi tinggi
        drawH = logoMaxSize;
        drawW = logoMaxSize * ratio;
      }

      // Posisikan vertikal di tengah area kop
      const logoY = y + (logoMaxSize - drawH) / 2;
      doc.image(logoPath, logoX, logoY, { width: drawW, height: drawH });
    } catch (_) {
      // Fallback: render dengan lebar saja, biarkan PDFKit hitung tinggi
      try { doc.image(logoPath, logoX, y, { width: logoMaxSize }); } catch (_) {}
    }
  }

  // Tingkatan
  doc.font(F_BOLD).fontSize(FS_KOP_TINGKAT).fillColor(GREEN)
     .text(tingkatan.toUpperCase(), textX, y, { width: textW, align: 'center' });
  y = doc.y + 1;

  // Nama organisasi
  doc.font(F_BOLD).fontSize(FS_KOP_NAMA).fillColor(GREEN)
     .text(namaOrg.toUpperCase(), textX, y, { width: textW, align: 'center' });
  y = doc.y + 1;

  // Daerah
  if (daerah) {
    doc.font(F_BOLD).fontSize(FS_KOP_DAERAH).fillColor(GREEN)
       .text(daerah.toUpperCase(), textX, y, { width: textW, align: 'center' });
    y = doc.y + 1;
  }

  // Alamat
  if (alamat) {
    doc.font(F_REG).fontSize(FS_KOP_ALAMAT).fillColor('#333333')
       .text(alamat, textX, y, { width: textW, align: 'center' });
    y = doc.y + 1;
  }

  // Kontak — teks biasa dengan prefiks, dipisah |
  const kontakParts = [];
  if (telepon) kontakParts.push(`No. Telp.: ${telepon}`);
  if (email)   kontakParts.push(`Email: ${email}`);
  if (website) kontakParts.push(`Website: ${website}`);
  const kontak = kontakParts.join('  |  ');
  if (kontak) {
    doc.font(F_REG).fontSize(FS_KOP_KONTAK).fillColor('#333333')
       .text(kontak, textX, y, { width: textW, align: 'center' });
    y = doc.y + 1;
  }

  // Satu garis tebal saja
  const lineY = Math.max(y + 4, (pageY !== undefined ? pageY : MT) + logoMaxSize + 4);
  doc.moveTo(ML, lineY).lineTo(ML + CW, lineY).lineWidth(2.5).strokeColor(GREEN).stroke();

  return lineY + 10;
}

// ── IDENTITAS SURAT ───────────────────────────────────────────────────────────
function drawIdentitasSurat(doc, surat, startY) {
  let y = startY + 4;
  const labelX = ML;
  const colonX = ML + 100;
  const valueX = colonX + 8;
  const valueW = CW - (valueX - ML);

  // Tanggal Hijriyah + Masehi rata kanan
  const hijriyah = (surat.tanggalHijriyah || '').replace(/H\.?\s*$/, '').trim();
  const tglHijr  = hijriyah + ' H.';
  const tglMasehi = surat.tanggalMasehi
    ? new Date(surat.tanggalMasehi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' M.'
    : '';
  const tempatTerbit = surat.tempatTerbit || 'Bandung';

  // Baris 1 tanggal: Tempat, Hijriyah
  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
     .text(`${tempatTerbit}, ${tglHijr}`, ML, y, { width: CW, align: 'right' });
  const y2 = doc.y;
  // Baris 2 tanggal: Masehi
  if (tglMasehi) {
    doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
       .text(tglMasehi, ML, y2, { width: CW, align: 'right' });
  }

  // Identitas kiri
  const rows = [
    { label: 'Nomor',    value: surat.nomorSurat || '-' },
    { label: 'Lampiran', value: surat.lampiran   || '-' },
    { label: 'Perihal',  value: surat.perihal    || '-' },
  ];

  let yLeft = y;
  for (const row of rows) {
    doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000');
    doc.text(row.label, labelX, yLeft, { width: 100, lineBreak: false });
    doc.text(':', colonX, yLeft, { width: 8, lineBreak: false });
    doc.text(row.value, valueX, yLeft, { width: valueW });
    yLeft = doc.y + 1;
  }

  return Math.max(yLeft, tglMasehi ? doc.y : y2) + 8;
}

// ── TUJUAN SURAT ──────────────────────────────────────────────────────────────
function drawTujuan(doc, surat, startY) {
  let y = startY;
  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
     .text('Kepada Yth.', ML, y, { width: CW });
  y = doc.y + 1;

  const tujuan = surat.tujuanSurat || surat.penerimaEksternal || '';
  if (tujuan) {
    const lines = tujuan.split('\n');
    for (const line of lines) {
      const txt = line.trim();
      if (!txt) continue;
      // Cetak tebal
      doc.font(F_BOLD).fontSize(FS_ISI).fillColor('#000000')
         .text(txt, ML, y, { width: CW });
      y = doc.y + 1;
    }
  }

  // "di" dan "Tempat" dipisah paragraf
  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
     .text('di', ML, y, { width: CW });
  y = doc.y + 1;
  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
     .text('        Tempat', ML, y, { width: CW });
  y = doc.y + 10;
  return y;
}

// ── RENDER LIST ITEM dengan hanging indent ────────────────────────────────────
function renderListItem(doc, block, x, y, maxW) {
  const segs   = block.segs || [];
  const indent = block.indent || 0;

  // Pisahkan prefix dari sisa teks
  const firstSeg = segs[0];
  // Prefix: angka "1. ", huruf "A. "/"a. ", romawi "IV. "/"iv. ", bullet "• "
  const isPrefix = firstSeg && /^([•\-]|[A-Za-z]{1,5}\.|\d+\.|[IVXivx]+\.)\s$/.test(firstSeg.text);

  if (!isPrefix) {
    const txt = segs.map(s => s.text).join('');
    doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000');
    doc.text(txt, x + indent, y, { width: maxW - indent, align: 'left', lineGap: LINE_GAP });
    return doc.y + 2;
  }

  const prefix   = firstSeg.text;
  const restSegs = segs.slice(1);
  const restTxt  = restSegs.map(s => s.text).join('');

  doc.font(F_REG).fontSize(FS_ISI);
  const prefixW = doc.widthOfString(prefix);
  const textX   = x + indent + prefixW;
  const textW   = maxW - indent - prefixW;

  // Tulis prefix
  doc.fillColor('#000000').text(prefix, x + indent, y, { width: prefixW + 2, lineBreak: false, lineGap: LINE_GAP });

  // Tulis teks konten dengan hanging indent
  if (restTxt) {
    doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000');
    doc.text(restTxt, textX, y, { width: Math.max(textW, 20), align: 'justify', lineGap: LINE_GAP });
  }

  return doc.y + 2;
}

// ── RENDER SATU BLOCK ─────────────────────────────────────────────────────────
function renderBlock(doc, block, y) {
  if (block.type === 'empty') {
    return y + FS_ISI * 1.2;
  } else if (block.type === 'image') {
    // Render gambar — support base64 dan URL lokal
    try {
      const src = block.src || '';
      // Hanya render base64 (data:image/...) — URL eksternal tidak bisa diakses dari server
      if (src.startsWith('data:image/')) {
        const maxW = CW;
        const maxH = 200;
        doc.image(Buffer.from(src.split(',')[1], 'base64'), ML, y, {
          fit: [maxW, maxH],
          align: 'left',
        });
        return doc.y + 6;
      }
    } catch (_) {}
    return y + 4;
  } else if (block.type === 'table') {
    return renderTable(doc, block, ML, y);
  } else if (block.type === 'listitem') {
    return renderListItem(doc, block, ML, y, CW);
  } else {
    return renderSegs(doc, block.segs || [], ML, y, CW, block.align || 'justify', block.bold || false);
  }
}

// ── RENDER BODY BLOCKS (dengan page-break otomatis) ───────────────────────────
async function renderBodyBlocks(doc, blocks, startY, kopHeight, organisasi, footerReserve) {
  const bodyMax = PH - footerReserve;
  let y = startY;

  for (const block of blocks) {
    const bh = estimateBlockHeight(doc, block) + 4;

    // Perlu halaman baru?
    if (y + bh > bodyMax) {
      doc.addPage();
      y = await drawKopSurat(doc, organisasi, MT);
    }

    if (block.type === 'empty') {
      // Baris kosong — tambah spasi vertikal
      y += FS_ISI * 1.2;
    } else if (block.type === 'table') {
      y = renderTable(doc, block, ML, y);
    } else if (block.type === 'listitem') {
      // List item dengan indent
      const indent = block.indent || 20;
      y = renderSegs(doc, block.segs || [], ML + indent, y, CW - indent, 'left', false);
    } else {
      const segs  = block.segs || [];
      const align = block.align || 'justify';
      const bold  = block.bold  || false;
      y = renderSegs(doc, segs, ML, y, CW, align, bold);
    }
    y += 2;
  }
  return y;
}

// ── TANDA TANGAN ──────────────────────────────────────────────────────────────
async function drawTandaTangan(doc, surat, startY, qrDataUrl) {
  const colW  = CW / 2;
  const qrSz  = 45;
  const gapTtd = FS_ISI * 3.5; // ruang tanda tangan

  // Ketua di KIRI, Sekretaris di KANAN
  const leftPerson  = surat.ketua;
  const rightPerson = surat.sekretaris;

  let y = startY + 8;

  // QR di atas nama penandatangan (kiri & kanan)
  if (qrDataUrl) {
    const qrXLeft  = ML + (colW - qrSz) / 2;
    const qrXRight = ML + colW + (colW - qrSz) / 2;
    try {
      if (leftPerson)  doc.image(qrDataUrl, qrXLeft,  y, { width: qrSz, height: qrSz });
      if (rightPerson) doc.image(qrDataUrl, qrXRight, y, { width: qrSz, height: qrSz });
    } catch (_) {}
    y += qrSz + 4;
  } else {
    y += gapTtd;
  }

  // Nama + jabatan kiri (Ketua)
  if (leftPerson) {
    doc.font(F_BOLD).fontSize(FS_ISI).fillColor('#000000')
       .text(leftPerson.namaLengkap || '', ML, y, { width: colW, align: 'center', underline: true });
    const yAfterNama = doc.y + 1;
    doc.font(F_REG).fontSize(FS_ISI - 1).fillColor('#333333')
       .text(leftPerson.jabatan || '', ML, yAfterNama, { width: colW, align: 'center' });
  }

  // Nama + jabatan kanan (Sekretaris)
  if (rightPerson) {
    doc.font(F_BOLD).fontSize(FS_ISI).fillColor('#000000')
       .text(rightPerson.namaLengkap || '', ML + colW, y, { width: colW, align: 'center', underline: true });
    const yAfterNama = doc.y + 1;
    doc.font(F_REG).fontSize(FS_ISI - 1).fillColor('#333333')
       .text(rightPerson.jabatan || '', ML + colW, yAfterNama, { width: colW, align: 'center' });
  }

  return doc.y + 6;
}

// ── FOOTER HALAMAN BIASA (hanya nomor halaman) ───────────────────────────────
function drawFooterSimple(doc, pageNum, totalPages) {
  const pageLabel = `${pageNum} dari ${totalPages}`;
  doc.font(F_REG).fontSize(8).fillColor('#888888')
     .text(pageLabel, ML, PH - 20, { width: CW, align: 'center' });
}

// ── FOOTER HALAMAN TTD (QR + verifikasi + nomor halaman) ─────────────────────
async function drawFooter(doc, surat, qrDataUrl, pageNum, totalPages) {
  const qrSz    = 55;
  const footerY = PH - 75;
  const verifikasiTxt =
    'Dokumen ini ditandatangani secara elektronik melalui Aplikasi Administrasi Persuratan ' +
    (surat.organisasiNama || 'PC Fatayat NU Kota Bandung') +
    ', untuk verifikasi surat scan QRCode.';

  // QR kiri bawah
  if (qrDataUrl) {
    try { doc.image(qrDataUrl, ML, footerY, { width: qrSz, height: qrSz }); } catch (_) {}
  }

  // Teks verifikasi di samping QR
  const txtX = ML + qrSz + 8;
  const txtW = CW - qrSz - 8;
  doc.font(F_REG).fontSize(7.5).fillColor('#555555')
     .text(verifikasiTxt, txtX, footerY + (qrSz - 20) / 2, { width: txtW, lineGap: 1.5 });

  // Nomor halaman tengah
  const pageLabel = `${pageNum} dari ${totalPages}`;
  doc.font(F_REG).fontSize(8).fillColor('#888888')
     .text(pageLabel, ML, PH - 20, { width: CW, align: 'center' });
}

// ── FOOTER LAMPIRAN (nomor surat kiri + nomor halaman tengah) ────────────────
function drawFooterLampiran(doc, nomorSurat, pageNum, totalPages) {
  const y = PH - 22;
  doc.font(F_REG).fontSize(8).fillColor('#888888');
  // Nomor surat kiri
  doc.text(`Nomor  :  ${nomorSurat || '-'}`, ML, y, { width: CW / 2, lineBreak: false });
  // Nomor halaman tengah
  doc.text(`${pageNum} dari ${totalPages}`, ML, y, { width: CW, align: 'center' });
}

// ── HELPER: NAMA JENIS SURAT ──────────────────────────────────────────────────
function getNamaJenisSurat(kode) {
  const map = {
    A: 'SURAT RUTIN INTERNAL', B: 'SURAT RUTIN EKSTERNAL',
    C: 'SURAT KETERANGAN',     D: 'SURAT REKOMENDASI',
    E: 'SURAT TUGAS',          F: 'SURAT MANDAT',
    G: 'SURAT INSTRUKSI',      H: 'SURAT PENGUMUMAN',
    I: 'SURAT EDARAN',         J: 'SURAT PERINGATAN',
    K: 'SURAT PERNYATAAN',     SK: 'SURAT KEPUTUSAN',
  };
  return map[kode] || kode;
}

// ── HELPER: TITIMANGSA (tempat & tanggal) ─────────────────────────────────────
function drawTitimangsa(doc, surat, startY) {
  const hijriyah   = (surat.tanggalHijriyah || '').replace(/H\.?\s*$/, '').trim();
  const tglHijr    = hijriyah + ' H.';
  const tglMasehi  = surat.tanggalMasehi
    ? new Date(surat.tanggalMasehi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' M.'
    : '';
  const tempat     = surat.tempatTerbit || 'Bandung';

  // Blok titimangsa di kanan (lebar ~200)
  const blokW  = 200;
  const blokX  = ML + CW - blokW;
  const labelW = 80;
  const colonX = blokX + labelW;
  const valX   = colonX + 8;
  const valW   = blokW - labelW - 8;

  let y = startY;

  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000');
  doc.text('Dikeluarkan di', blokX, y, { width: labelW, lineBreak: false });
  doc.text(':', colonX, y, { width: 8, lineBreak: false });
  doc.text(tempat, valX, y, { width: valW });
  y = doc.y + 1;

  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000');
  doc.text('Pada tanggal', blokX, y, { width: labelW, lineBreak: false });
  doc.text(':', colonX, y, { width: 8, lineBreak: false });
  doc.text(tglHijr, valX, y, { width: valW });
  y = doc.y + 1;

  if (tglMasehi) {
    doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000');
    doc.text('', blokX, y, { width: labelW, lineBreak: false });
    doc.text('', colonX, y, { width: 8, lineBreak: false });
    doc.text(tglMasehi, valX, y, { width: valW });
    y = doc.y + 1;
  }

  return y + 6;
}

// ── HELPER: TITIMANGSA SK (Ditetapkan di / Tanggal) ──────────────────────────
function drawTitimangsaSK(doc, surat, startY) {
  const hijriyah   = (surat.tanggalHijriyah || '').replace(/H\.?\s*$/, '').trim();
  const tglHijr    = hijriyah + ' H.';
  const tglMasehi  = surat.tanggalMasehi
    ? new Date(surat.tanggalMasehi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' M.'
    : '';
  const tempat     = surat.tempatTerbit || 'Bandung';

  const blokW  = 200;
  const blokX  = ML + CW - blokW;
  const labelW = 80;
  const colonX = blokX + labelW;
  const valX   = colonX + 8;
  const valW   = blokW - labelW - 8;

  let y = startY;

  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000');
  doc.text('Ditetapkan di', blokX, y, { width: labelW, lineBreak: false });
  doc.text(':', colonX, y, { width: 8, lineBreak: false });
  doc.text(tempat, valX, y, { width: valW });
  y = doc.y + 1;

  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000');
  doc.text('Tanggal', blokX, y, { width: labelW, lineBreak: false });
  doc.text(':', colonX, y, { width: 8, lineBreak: false });
  doc.text(tglHijr, valX, y, { width: valW });
  y = doc.y + 1;

  if (tglMasehi) {
    doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000');
    doc.text('', blokX, y, { width: labelW, lineBreak: false });
    doc.text('', colonX, y, { width: 8, lineBreak: false });
    doc.text(tglMasehi, valX, y, { width: valW });
    y = doc.y + 1;
  }

  return y + 6;
}

// ── LAYOUT 2: SURAT KHUSUS (C,D,E,F,G,H,I,J,K) ───────────────────────────────
// Judul jenis surat + nomor di tengah, titimangsa sebelum TTD, lampiran tanpa TTD
async function generateLayoutKhusus(doc, surat, organisasi, qrDataUrl, FOOTER_RESERVE) {
  const bodyBlocks     = parseHtml(surat.isiSurat || '');
  const lampiranBlocks = surat.lampiranIsi ? parseHtml(surat.lampiranIsi) : [];

  // Estimasi total halaman
  let totalPages = 1;
  if (lampiranBlocks.length) totalPages++;

  // ── Kop ──
  let y = await drawKopSurat(doc, organisasi, MT);
  const kopHeight = y;
  y += 8;

  // ── Judul jenis surat (tengah, bold) ──
  const namaJenis = getNamaJenisSurat(surat.jenisSurat);
  doc.font(F_BOLD).fontSize(FS_ISI + 1).fillColor('#000000')
     .text(namaJenis, ML, y, { width: CW, align: 'center' });
  y = doc.y + 2;

  // ── Nomor surat (tengah) ──
  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
     .text(`Nomor: ${surat.nomorSurat || '-'}`, ML, y, { width: CW, align: 'center' });
  y = doc.y + 14;

  // ── Isi surat ──
  const bodyMax = PH - FOOTER_RESERVE;
  for (const block of bodyBlocks) {
    const bh = estimateBlockHeight(doc, block) + 4;
    if (y + bh > bodyMax) {
      doc.addPage(); totalPages++;
      y = await drawKopSurat(doc, organisasi, MT);
    }
    y = renderBlock(doc, block, y) + 2;
  }

  // ── Titimangsa + TTD ──
  const ttdH = (qrDataUrl ? 45 : FS_ISI * 3.5) + FS_ISI * 3 + 50;
  if (y + ttdH > bodyMax) {
    doc.addPage(); totalPages++;
    y = await drawKopSurat(doc, organisasi, MT);
  }
  y = drawTitimangsa(doc, surat, y);
  y = await drawTandaTangan(doc, surat, y, qrDataUrl);

  // ── Footer: QR+verifikasi hanya di halaman TTD, halaman lain hanya nomor ──
  const range = doc.bufferedPageRange();
  for (let pi = 0; pi < range.count; pi++) {
    doc.switchToPage(range.start + pi);
    if (pi === range.count - 1) {
      await drawFooter(doc, surat, qrDataUrl, pi + 1, totalPages);
    } else {
      drawFooterSimple(doc, pi + 1, totalPages);
    }
  }

  // ── Lampiran (tanpa titimangsa & TTD) ──
  let currentPage = range.count;
  if (lampiranBlocks.length) {
    doc.addPage(); currentPage++;
    y = await drawKopSurat(doc, organisasi, MT);

    doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
       .text(`Lampiran Surat Nomor  :  ${surat.nomorSurat || '-'}`, ML, y, { width: CW });
    y = doc.y + 12;

    for (const block of lampiranBlocks) {
      const bh = estimateBlockHeight(doc, block) + 4;
      if (y + bh > bodyMax) {
        drawFooterLampiran(doc, surat.nomorSurat, currentPage, totalPages);
        doc.addPage(); currentPage++;
        y = await drawKopSurat(doc, organisasi, MT);
      }
      y = renderBlock(doc, block, y) + 2;
    }
    drawFooterLampiran(doc, surat.nomorSurat, currentPage, totalPages);
  }
}

// ── LAYOUT 3: SURAT KEPUTUSAN (SK) ───────────────────────────────────────────
// Judul + nomor + "Tentang" + perihal di tengah, titimangsa SK sebelum TTD,
// lampiran dengan titimangsa SK & TTD di akhir
async function generateLayoutSK(doc, surat, organisasi, qrDataUrl, FOOTER_RESERVE) {
  const bodyBlocks     = parseHtml(surat.isiSurat || '');
  const lampiranBlocks = surat.lampiranIsi ? parseHtml(surat.lampiranIsi) : [];
  let totalPages = 1;
  if (lampiranBlocks.length) totalPages++;

  // ── Kop ──
  let y = await drawKopSurat(doc, organisasi, MT);
  const kopHeight = y;
  y += 8;

  // ── SURAT KEPUTUSAN (bold, tengah) ──
  doc.font(F_BOLD).fontSize(FS_ISI + 1).fillColor('#000000')
     .text('SURAT KEPUTUSAN', ML, y, { width: CW, align: 'center' });
  y = doc.y + 2;

  // ── Nomor ──
  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
     .text(`Nomor: ${surat.nomorSurat || '-'}`, ML, y, { width: CW, align: 'center' });
  y = doc.y + 8;

  // ── Tentang ──
  doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
     .text('Tentang', ML, y, { width: CW, align: 'center' });
  y = doc.y + 4;

  // ── Perihal (judul SK) — bold, tengah ──
  if (surat.perihal) {
    doc.font(F_BOLD).fontSize(FS_ISI).fillColor('#000000')
       .text(surat.perihal.toUpperCase(), ML, y, { width: CW, align: 'center' });
    y = doc.y + 14;
  }

  // ── Isi surat ──
  const bodyMax = PH - FOOTER_RESERVE;
  for (const block of bodyBlocks) {
    const bh = estimateBlockHeight(doc, block) + 4;
    if (y + bh > bodyMax) {
      doc.addPage(); totalPages++;
      y = await drawKopSurat(doc, organisasi, MT);
    }
    y = renderBlock(doc, block, y) + 2;
  }

  // ── Titimangsa SK + TTD ──
  const ttdH = (qrDataUrl ? 45 : FS_ISI * 3.5) + FS_ISI * 3 + 50;
  if (y + ttdH > bodyMax) {
    doc.addPage(); totalPages++;
    y = await drawKopSurat(doc, organisasi, MT);
  }
  y = drawTitimangsaSK(doc, surat, y);
  y = await drawTandaTangan(doc, surat, y, qrDataUrl);

  // ── Footer: QR+verifikasi hanya di halaman TTD, halaman lain hanya nomor ──
  const range = doc.bufferedPageRange();
  for (let pi = 0; pi < range.count; pi++) {
    doc.switchToPage(range.start + pi);
    if (pi === range.count - 1) {
      await drawFooter(doc, surat, qrDataUrl, pi + 1, totalPages);
    } else {
      drawFooterSimple(doc, pi + 1, totalPages);
    }
  }

  // ── Lampiran SK: dengan titimangsa SK & TTD di akhir ──
  let currentPage = range.count;
  if (lampiranBlocks.length) {
    doc.addPage(); currentPage++;
    y = await drawKopSurat(doc, organisasi, MT);

    // Header lampiran SK
    doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
       .text(`Lampiran Surat Nomor: ${surat.nomorSurat || '-'}`, ML, y, { width: CW });
    y = doc.y + 12;

    for (const block of lampiranBlocks) {
      const bh = estimateBlockHeight(doc, block) + 4;
      if (y + bh > bodyMax) {
        drawFooterLampiran(doc, surat.nomorSurat, currentPage, totalPages);
        doc.addPage(); currentPage++;
        y = await drawKopSurat(doc, organisasi, MT);
      }
      y = renderBlock(doc, block, y) + 2;
    }

    // Titimangsa SK + TTD di akhir lampiran
    const ttdLamH = (qrDataUrl ? 45 : FS_ISI * 3.5) + FS_ISI * 3 + 50;
    if (y + ttdLamH > bodyMax) {
      drawFooterLampiran(doc, surat.nomorSurat, currentPage, totalPages);
      doc.addPage(); currentPage++;
      y = await drawKopSurat(doc, organisasi, MT);
    }
    y = drawTitimangsaSK(doc, surat, y);
    await drawTandaTangan(doc, surat, y, qrDataUrl);

    drawFooterLampiran(doc, surat.nomorSurat, currentPage, totalPages);
  }
}

// ── HITUNG TOTAL HALAMAN (untuk layout rutin) ────────────────────────────────
async function countPages(doc, surat, organisasi, bodyBlocks, lampiranBlocks, kopHeight, footerReserve) {
  const bodyMax = PH - footerReserve;
  const firstPageStart = kopHeight + 60 + (surat.tujuanSurat || surat.penerimaEksternal ? 60 : 10);
  let pages = 1;
  let y = firstPageStart;

  for (const block of bodyBlocks) {
    const bh = estimateBlockHeight(doc, block) + 4;
    if (y + bh > bodyMax) { pages++; y = kopHeight + bh; }
    else y += bh;
  }

  if (y + 120 > bodyMax) pages++;

  if (lampiranBlocks && lampiranBlocks.length) {
    pages++;
    y = kopHeight + 30;
    for (const block of lampiranBlocks) {
      const bh = estimateBlockHeight(doc, block) + 4;
      if (y + bh > bodyMax) { pages++; y = kopHeight + bh; }
      else y += bh;
    }
  }

  return pages;
}

// ── LAYOUT 1: SURAT RUTIN (A, B) — layout existing ───────────────────────────
async function generateLayoutRutin(doc, surat, organisasi, qrDataUrl, FOOTER_RESERVE) {
  const bodyBlocks     = parseHtml(surat.isiSurat || '');
  const lampiranBlocks = surat.lampiranIsi ? parseHtml(surat.lampiranIsi) : [];

  let y = await drawKopSurat(doc, organisasi, MT);
  const kopHeight = y;

  y = drawIdentitasSurat(doc, surat, y);

  if (surat.tujuanSurat || surat.penerimaEksternal) {
    y = drawTujuan(doc, surat, y);
  } else {
    y += 8;
  }

  const totalPages = await countPages(doc, surat, organisasi, bodyBlocks, lampiranBlocks, kopHeight, FOOTER_RESERVE);

  y = await renderBodyBlocks(doc, bodyBlocks, y, kopHeight, organisasi, FOOTER_RESERVE);

  const ttdHeight = (qrDataUrl ? 45 : 0) + FS_ISI * 3 + 30;
  if (y + ttdHeight > PH - FOOTER_RESERVE) {
    doc.addPage();
    y = await drawKopSurat(doc, organisasi, MT);
  }
  y = await drawTandaTangan(doc, surat, y, qrDataUrl);

  const range = doc.bufferedPageRange();
  for (let pi = 0; pi < range.count; pi++) {
    doc.switchToPage(range.start + pi);
    if (pi === range.count - 1) {
      await drawFooter(doc, surat, qrDataUrl, pi + 1, totalPages);
    } else {
      drawFooterSimple(doc, pi + 1, totalPages);
    }
  }

  let currentPage = range.count;
  if (lampiranBlocks.length) {
    doc.addPage(); currentPage++;
    y = await drawKopSurat(doc, organisasi, MT);

    doc.font(F_REG).fontSize(FS_ISI).fillColor('#000000')
       .text(`Lampiran Surat Nomor  :  ${surat.nomorSurat || '-'}`, ML, y, { width: CW });
    y = doc.y + 12;

    const bodyMaxLam = PH - FOOTER_RESERVE;
    for (const block of lampiranBlocks) {
      const bh = estimateBlockHeight(doc, block) + 4;
      if (y + bh > bodyMaxLam) {
        drawFooterLampiran(doc, surat.nomorSurat, currentPage, totalPages);
        doc.addPage(); currentPage++;
        y = await drawKopSurat(doc, organisasi, MT);
      }
      y = renderBlock(doc, block, y) + 2;
    }
    drawFooterLampiran(doc, surat.nomorSurat, currentPage, totalPages);
  }
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
async function generateSuratPDF(surat, organisasi) {
  const uploadDir = path.join(__dirname, '../../uploads/pdf');
  if (!fs2.existsSync(uploadDir)) fs2.mkdirSync(uploadDir, { recursive: true });

  const safeNomor = (surat.nomorSurat || surat.id).replace(/\//g, '-');
  const filename  = `surat-${safeNomor}-${Date.now()}.pdf`;
  const filepath  = path.join(uploadDir, filename);

  let qrDataUrl = null;
  if (surat.qrCodeToken) {
    try { qrDataUrl = await generateQRCodeDataURL(surat.qrCodeToken); } catch (_) {}
  }

  surat.organisasiNama = organisasi.namaOrg
    ? `${organisasi.tingkatanOrg || ''} ${organisasi.namaOrg} ${organisasi.daerahOrg || ''}`.trim()
    : 'PC Fatayat NU Kota Bandung';

  const FOOTER_RESERVE = 90;

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true, bufferPages: true });
      registerArabFonts(doc);

      const stream = fs2.createWriteStream(filepath);
      doc.pipe(stream);

      const jenis = surat.jenisSurat || 'A';

      if (jenis === 'SK') {
        // Layout 3: Surat Keputusan
        await generateLayoutSK(doc, surat, organisasi, qrDataUrl, FOOTER_RESERVE);
      } else if (jenis === 'A' || jenis === 'B') {
        // Layout 1: Surat Rutin
        await generateLayoutRutin(doc, surat, organisasi, qrDataUrl, FOOTER_RESERVE);
      } else {
        // Layout 2: Surat Khusus (C,D,E,F,G,H,I,J,K)
        await generateLayoutKhusus(doc, surat, organisasi, qrDataUrl, FOOTER_RESERVE);
      }

      doc.end();
      stream.on('finish', () => resolve({ filepath }));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateSuratPDF };
