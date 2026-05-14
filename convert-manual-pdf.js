/**
 * Konversi USER-MANUAL.md → USER-MANUAL.pdf
 * Menggunakan PDFKit (sudah terinstall di backend)
 * Jalankan: node convert-manual-pdf.js
 */

const PDFDocument = require('./backend/node_modules/pdfkit');
const fs = require('fs');
const path = require('path');

const INPUT  = path.join(__dirname, 'USER-MANUAL.md');
const OUTPUT = path.join(__dirname, 'USER-MANUAL.pdf');

// ── Konstanta ─────────────────────────────────────────────────────────────────
const ML = 56, MR = 56;
const PW = 595.28, PH = 841.89; // A4
const CW = PW - ML - MR;
const CONTENT_BOTTOM = PH - 50;

const C_PRIMARY    = '#166534';
const C_H2_BG      = '#dcfce7';
const C_H3         = '#15803d';
const C_H4         = '#16a34a';
const C_TEXT       = '#1a1a1a';
const C_MUTED      = '#6b7280';
const C_NOTE_BG    = '#f0fdf4';
const C_NOTE_LINE  = '#86efac';
const C_WARN_BG    = '#fffbeb';
const C_WARN_LINE  = '#f59e0b';
const C_CODE_BG    = '#f3f4f6';
const C_TBL_HEAD   = '#dcfce7';
const C_TBL_ALT    = '#f9fafb';
const C_TBL_BORDER = '#d1d5db';
const C_HR         = '#d1fae5';

const F_REG  = 'Helvetica';
const F_BOLD = 'Helvetica-Bold';
const F_OBL  = 'Helvetica-Oblique';

// ── Baca markdown ─────────────────────────────────────────────────────────────
const raw   = fs.readFileSync(INPUT, 'utf8');
const lines = raw.split('\n');

// ── Dokumen ───────────────────────────────────────────────────────────────────
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: ML, right: MR },
  bufferPages: true,
  info: {
    Title:   'User Manual SAFIRA',
    Author:  'Fatayat Nahdlatul Ulama',
    Subject: 'Panduan Penggunaan Aplikasi SAFIRA',
  },
});

const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

// ── Helpers ───────────────────────────────────────────────────────────────────
function curY() { return doc.y; }

function needPage(h = 30) {
  if (doc.y + h > CONTENT_BOTTOM) {
    doc.addPage();
  }
}

/** Hapus markdown inline, kembalikan teks bersih */
function clean(text) {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim();
}

/**
 * Render teks dengan inline bold/italic/code.
 * Mengembalikan posisi Y setelah render.
 */
function renderInline(text, x, y, opts = {}) {
  const size  = opts.size  || 10;
  const color = opts.color || C_TEXT;
  const width = opts.width || CW;
  const lineGap = opts.lineGap !== undefined ? opts.lineGap : 1.5;

  // Tokenize
  const tokens = [];
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ t: text.slice(last, m.index), f: F_REG, c: color });
    if (m[2]) tokens.push({ t: m[2], f: F_BOLD, c: color });
    else if (m[3]) tokens.push({ t: m[3], f: F_BOLD, c: color });
    else if (m[4]) tokens.push({ t: m[4], f: F_OBL,  c: color });
    else if (m[5]) tokens.push({ t: m[5], f: F_BOLD, c: '#166534' });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ t: text.slice(last), f: F_REG, c: color });

  if (tokens.length === 0) return;

  // Render semua token sebagai satu blok teks (continued)
  // Untuk simplisitas, render sebagai teks bersih dengan font utama
  // (PDFKit continued mode tidak mendukung ganti font di tengah baris dengan baik)
  const cleanText = tokens.map(t => t.t).join('');
  // Cek apakah ada bold
  const hasBold = tokens.some(t => t.f === F_BOLD && t.c === color);
  const font = hasBold ? F_BOLD : F_REG;

  doc.font(font).fontSize(size).fillColor(color)
     .text(cleanText, x, y, { width, lineGap, align: opts.align || 'left' });
}

// ── Cover page ────────────────────────────────────────────────────────────────
// Header hijau
doc.rect(0, 0, PW, 200).fillColor(C_PRIMARY).fill();
doc.rect(0, 197, PW, 6).fillColor('#15803d').fill();
doc.rect(0, 200, PW, 3).fillColor('#86efac').fill();

doc.font(F_BOLD).fontSize(30).fillColor('#ffffff')
   .text('USER MANUAL', ML, 60, { width: CW, align: 'center' });
doc.font(F_BOLD).fontSize(20).fillColor('#bbf7d0')
   .text('APLIKASI SAFIRA', ML, 100, { width: CW, align: 'center' });
doc.font(F_OBL).fontSize(11).fillColor('#d1fae5')
   .text('Sistem Administrasi Fatayat untuk Informasi Risalah dan Arsip', ML, 140, { width: CW, align: 'center' });

// Info box
const bx = ML + 50, bw = CW - 100, by = 230;
doc.rect(bx, by, bw, 140).fillColor(C_NOTE_BG).strokeColor(C_NOTE_LINE).lineWidth(1).fillAndStroke();
doc.font(F_BOLD).fontSize(12).fillColor(C_PRIMARY)
   .text('Informasi Dokumen', bx, by + 14, { width: bw, align: 'center' });

const info = [['Versi','1.0.0'],['Tahun','2026'],['Organisasi','Fatayat Nahdlatul Ulama'],['Dokumen','Panduan Penggunaan Aplikasi']];
info.forEach(([lbl, val], idx) => {
  const iy = by + 42 + idx * 22;
  doc.font(F_BOLD).fontSize(10).fillColor(C_MUTED).text(lbl + ':', bx + 20, iy, { width: 90 });
  doc.font(F_REG).fontSize(10).fillColor(C_TEXT).text(val, bx + 115, iy, { width: bw - 130 });
});

// Footer cover
doc.rect(0, PH - 55, PW, 55).fillColor('#f0fdf4').fill();
doc.rect(0, PH - 57, PW, 2).fillColor(C_HR).fill();
doc.font(F_OBL).fontSize(8.5).fillColor(C_MUTED)
   .text('© 2026 Fatayat Nahdlatul Ulama — Dokumen ini hanya untuk penggunaan internal.', ML, PH - 38, { width: CW, align: 'center' });

doc.addPage();

// ── Parse & render isi ────────────────────────────────────────────────────────
let inTable     = false;
let tableHdr    = [];
let tableRows   = [];
let inCode      = false;
let codeLines   = [];
let listBuf     = [];   // { depth, ordered, marker, text }

function flushCode() {
  if (!codeLines.length) return;
  const txt = codeLines.join('\n');
  doc.font(F_BOLD).fontSize(8.5);
  const h = doc.heightOfString(txt, { width: CW - 14 }) + 18;
  needPage(h + 8);
  doc.rect(ML, doc.y, CW, h).fillColor(C_CODE_BG).fill();
  doc.rect(ML, doc.y, 3, h).fillColor(C_PRIMARY).fill();
  doc.font(F_BOLD).fontSize(8.5).fillColor('#374151')
     .text(txt, ML + 10, doc.y + 9, { width: CW - 18, lineGap: 2 });
  doc.y += h + 6;
  codeLines = [];
}

function flushList() {
  if (!listBuf.length) return;
  listBuf.forEach(item => {
    const indent = ML + item.depth * 14;
    const tw = CW - item.depth * 14 - 14;
    doc.font(F_BOLD).fontSize(9.5);
    const h = doc.heightOfString(clean(item.text), { width: tw }) + 4;
    needPage(h + 2);
    const bullet = item.ordered ? item.marker : '•';
    doc.font(F_BOLD).fontSize(9.5).fillColor(C_PRIMARY)
       .text(bullet, indent, doc.y, { width: 12, lineBreak: false });
    doc.font(F_REG).fontSize(9.5).fillColor(C_TEXT)
       .text(clean(item.text), indent + 14, doc.y, { width: tw, lineGap: 1.5 });
  });
  listBuf = [];
  doc.moveDown(0.25);
}

function flushTable() {
  if (!tableHdr.length) return;
  const allRows = [tableHdr, ...tableRows];
  const cols = tableHdr.length;
  if (!cols) { tableHdr = []; tableRows = []; return; }

  const colW = new Array(cols).fill(CW / cols);
  const PADX = 5, PADY = 3;

  allRows.forEach((row, ri) => {
    const isHdr = ri === 0;
    // Hitung tinggi baris
    let rh = 18;
    row.forEach((cell, ci) => {
      doc.font(isHdr ? F_BOLD : F_REG).fontSize(9);
      const h = doc.heightOfString(clean(cell), { width: colW[ci] - PADX * 2 }) + PADY * 2;
      if (h > rh) rh = h;
    });

    needPage(rh + 2);
    const y = doc.y;

    // Background
    doc.rect(ML, y, CW, rh).fillColor(isHdr ? C_TBL_HEAD : (ri % 2 === 0 ? '#ffffff' : C_TBL_ALT)).fill();
    // Border luar
    doc.rect(ML, y, CW, rh).strokeColor(C_TBL_BORDER).lineWidth(0.5).stroke();

    let cx = ML;
    row.forEach((cell, ci) => {
      if (ci > 0) {
        doc.moveTo(cx, y).lineTo(cx, y + rh).strokeColor(C_TBL_BORDER).lineWidth(0.4).stroke();
      }
      doc.font(isHdr ? F_BOLD : F_REG).fontSize(9)
         .fillColor(isHdr ? C_PRIMARY : C_TEXT)
         .text(clean(cell), cx + PADX, y + PADY, { width: colW[ci] - PADX * 2, lineGap: 1 });
      cx += colW[ci];
    });

    doc.y = y + rh;
  });

  doc.moveDown(0.4);
  tableHdr = []; tableRows = [];
}

// ── Loop baris ────────────────────────────────────────────────────────────────
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Code block fence
  if (line.startsWith('```')) {
    if (inCode) { flushCode(); inCode = false; }
    else {
      if (listBuf.length) flushList();
      if (inTable) { flushTable(); inTable = false; }
      inCode = true;
    }
    continue;
  }
  if (inCode) { codeLines.push(line); continue; }

  // Single-line backtick block (` ... ` on its own line)
  if (/^`[^`].+`$/.test(line.trim())) {
    if (listBuf.length) flushList();
    if (inTable) { flushTable(); inTable = false; }
    codeLines = [line.trim().slice(1, -1)];
    flushCode();
    continue;
  }

  // Tabel
  if (line.trim().startsWith('|')) {
    if (listBuf.length) flushList();
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.every(c => /^[-: ]+$/.test(c))) continue; // separator
    if (!inTable) { inTable = true; tableHdr = cells; }
    else tableRows.push(cells);
    continue;
  } else if (inTable) {
    flushTable(); inTable = false;
  }

  // List
  const lm = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)/);
  if (lm) {
    if (inTable) { flushTable(); inTable = false; }
    listBuf.push({
      depth: Math.floor(lm[1].length / 2),
      ordered: /^\d+\./.test(lm[2]),
      marker: lm[2],
      text: lm[3],
    });
    continue;
  } else if (listBuf.length && line.trim() === '') {
    flushList();
    continue;
  } else if (listBuf.length && !line.match(/^#+/) && !line.trim().startsWith('|') && !line.trim().startsWith('>')) {
    // Lanjutan item list (indented)
    if (line.match(/^\s{2,}/)) {
      listBuf[listBuf.length - 1].text += ' ' + line.trim();
      continue;
    }
    flushList();
  }

  // HR
  if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
    if (listBuf.length) flushList();
    needPage(16);
    doc.moveDown(0.3);
    doc.rect(ML, doc.y, CW, 1.5).fillColor(C_HR).fill();
    doc.moveDown(0.6);
    continue;
  }

  // Headings
  const h1m = line.match(/^# (.+)/);
  const h2m = line.match(/^## (.+)/);
  const h3m = line.match(/^### (.+)/);
  const h4m = line.match(/^#### (.+)/);

  if (h1m) {
    if (listBuf.length) flushList();
    needPage(50);
    doc.moveDown(0.4);
    const th = 34;
    doc.rect(ML, doc.y, CW, th).fillColor(C_PRIMARY).fill();
    doc.font(F_BOLD).fontSize(16).fillColor('#ffffff')
       .text(clean(h1m[1]), ML + 12, doc.y + 9, { width: CW - 24 });
    doc.y += th + 8;
    continue;
  }
  if (h2m) {
    if (listBuf.length) flushList();
    needPage(40);
    doc.moveDown(0.6);
    const th = 24;
    doc.rect(ML, doc.y, CW, th).fillColor(C_H2_BG).fill();
    doc.rect(ML, doc.y, 4, th).fillColor(C_PRIMARY).fill();
    doc.font(F_BOLD).fontSize(13).fillColor(C_PRIMARY)
       .text(clean(h2m[1]), ML + 12, doc.y + 5, { width: CW - 16 });
    doc.y += th + 6;
    continue;
  }
  if (h3m) {
    if (listBuf.length) flushList();
    needPage(30);
    doc.moveDown(0.5);
    doc.font(F_BOLD).fontSize(11).fillColor(C_H3)
       .text(clean(h3m[1]), ML, doc.y, { width: CW });
    doc.rect(ML, doc.y + 1, 80, 1.5).fillColor(C_H3).fill();
    doc.moveDown(0.4);
    continue;
  }
  if (h4m) {
    if (listBuf.length) flushList();
    needPage(22);
    doc.moveDown(0.3);
    doc.font(F_BOLD).fontSize(10).fillColor(C_H4)
       .text(clean(h4m[1]), ML, doc.y, { width: CW });
    doc.moveDown(0.25);
    continue;
  }

  // Blockquote
  const bqm = line.match(/^>\s*(.*)/);
  if (bqm) {
    if (listBuf.length) flushList();
    const txt = clean(bqm[1]);
    if (!txt) { doc.moveDown(0.2); continue; }
    const isWarn = txt.startsWith('⚠') || /^(perhatian|penting|warning)/i.test(txt);
    doc.font(F_OBL).fontSize(9.5);
    const bh = doc.heightOfString(txt, { width: CW - 22 }) + 14;
    needPage(bh + 6);
    doc.rect(ML, doc.y, CW, bh).fillColor(isWarn ? C_WARN_BG : C_NOTE_BG).fill();
    doc.rect(ML, doc.y, 3, bh).fillColor(isWarn ? C_WARN_LINE : C_NOTE_LINE).fill();
    doc.font(F_OBL).fontSize(9.5).fillColor(C_MUTED)
       .text(txt, ML + 11, doc.y + 7, { width: CW - 18, lineGap: 1.5 });
    doc.y += bh + 5;
    continue;
  }

  // Baris kosong
  if (line.trim() === '') {
    doc.moveDown(0.25);
    continue;
  }

  // Paragraf biasa
  const txt = clean(line);
  if (!txt) continue;
  doc.font(F_REG).fontSize(9.5);
  const ph = doc.heightOfString(txt, { width: CW }) + 4;
  needPage(ph);
  doc.font(F_REG).fontSize(9.5).fillColor(C_TEXT)
     .text(txt, ML, doc.y, { width: CW, lineGap: 1.5 });
  doc.moveDown(0.15);
}

// Flush sisa
if (listBuf.length) flushList();
if (inTable) flushTable();
if (inCode)  flushCode();

// ── Header & footer tiap halaman ──────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let p = 0; p < range.count; p++) {
  doc.switchToPage(range.start + p);
  const pageNum = p + 1;
  if (pageNum === 1) continue; // skip cover

  // Header
  doc.rect(ML, 18, CW, 0.8).fillColor(C_HR).fill();
  doc.font(F_BOLD).fontSize(7).fillColor(C_MUTED)
     .text('USER MANUAL SAFIRA', ML, 22, { width: CW / 2 });
  doc.font(F_REG).fontSize(7).fillColor(C_MUTED)
     .text('Fatayat Nahdlatul Ulama', ML + CW / 2, 22, { width: CW / 2, align: 'right' });
  doc.rect(ML, 30, CW, 0.5).fillColor(C_HR).fill();

  // Footer
  doc.rect(ML, PH - 36, CW, 0.5).fillColor(C_HR).fill();
  doc.font(F_REG).fontSize(7.5).fillColor(C_MUTED)
     .text(`${pageNum - 1}`, ML, PH - 28, { width: CW, align: 'center' });
}

doc.end();

stream.on('finish', () => {
  const pages = range.count - 1; // exclude cover
  const size  = (fs.statSync(OUTPUT).size / 1024).toFixed(1);
  console.log(`✅ PDF berhasil dibuat: ${OUTPUT}`);
  console.log(`   Halaman isi : ${pages} halaman (+ 1 cover)`);
  console.log(`   Ukuran file : ${size} KB`);
});

stream.on('error', err => {
  console.error('❌ Gagal:', err.message);
  process.exit(1);
});
