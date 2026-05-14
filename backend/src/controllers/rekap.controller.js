const prisma = require('../config/prisma');
const XLSX   = require('xlsx');
const PDFDocument = require('pdfkit');
const path   = require('path');
const fs     = require('fs');

// ── Helper format tanggal ─────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ── Label status ──────────────────────────────────────────────────────────────
const STATUS_KELUAR = {
  DRAFT: 'Draft', MENUNGGU_SEKRETARIS: 'Menunggu Sekretaris',
  MENUNGGU_KETUA: 'Menunggu Ketua', DITOLAK_SEKRETARIS: 'Ditolak Sekretaris',
  DITOLAK_KETUA: 'Ditolak Ketua', SELESAI: 'Selesai',
};
const STATUS_MASUK = { BARU: 'Baru', DIBACA: 'Dibaca', DIDISPOSISI: 'Didisposisi' };
const JENIS_SURAT  = {
  A: 'Surat Rutin Internal', B: 'Surat Rutin Eksternal',
  C: 'Surat Keterangan', D: 'Surat Rekomendasi', E: 'Surat Tugas',
  F: 'Surat Mandat', G: 'Surat Instruksi', H: 'Surat Pengumuman',
  I: 'Surat Edaran', J: 'Surat Peringatan', K: 'Surat Pernyataan',
  SK: 'Surat Keputusan',
};

// ── Build where clause dengan filter tanggal ──────────────────────────────────
function buildDateWhere(startDate, endDate, field = 'createdAt') {
  const where = {};
  if (startDate || endDate) {
    where[field] = {};
    if (startDate) where[field].gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where[field].lte = end;
    }
  }
  return where;
}

// ── GET DATA REKAP ────────────────────────────────────────────────────────────
const getRekapData = async (req, res) => {
  try {
    const { jenis, startDate, endDate, status } = req.query;

    if (jenis === 'keluar') {
      const where = { ...buildDateWhere(startDate, endDate, 'tanggalMasehi') };
      if (status) where.status = status;

      const data = await prisma.suratKeluar.findMany({
        where,
        include: {
          pembuat:    { select: { namaLengkap: true } },
          sekretaris: { select: { namaLengkap: true } },
          ketua:      { select: { namaLengkap: true } },
        },
        orderBy: { tanggalMasehi: 'asc' },
      });

      const statistik = {
        total: data.length,
        draft: data.filter(s => s.status === 'DRAFT').length,
        menunggu: data.filter(s => ['MENUNGGU_SEKRETARIS','MENUNGGU_KETUA'].includes(s.status)).length,
        selesai: data.filter(s => s.status === 'SELESAI').length,
        ditolak: data.filter(s => ['DITOLAK_SEKRETARIS','DITOLAK_KETUA'].includes(s.status)).length,
      };

      return res.json({ success: true, data, statistik });
    }

    if (jenis === 'masuk') {
      const where = { ...buildDateWhere(startDate, endDate, 'tanggalSurat') };
      if (status) where.status = status;

      const data = await prisma.suratMasuk.findMany({
        where,
        include: {
          uploader:  { select: { namaLengkap: true } },
          disposisi: {
            include: {
              penerima:   { select: { namaLengkap: true } },
              dibuatOleh: { select: { namaLengkap: true } },
            },
          },
        },
        orderBy: { tanggalSurat: 'asc' },
      });

      const statistik = {
        total: data.length,
        baru: data.filter(s => s.status === 'BARU').length,
        dibaca: data.filter(s => s.status === 'DIBACA').length,
        didisposisi: data.filter(s => s.status === 'DIDISPOSISI').length,
      };

      return res.json({ success: true, data, statistik });
    }

    return res.status(400).json({ success: false, message: 'Parameter jenis harus "keluar" atau "masuk"' });
  } catch (err) {
    console.error('Rekap error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// ── EXPORT EXCEL ──────────────────────────────────────────────────────────────
const exportExcel = async (req, res) => {
  try {
    const { jenis, startDate, endDate, status } = req.query;
    const organisasi = await prisma.organisasiProfil.findFirst();
    const namaOrg = organisasi?.namaOrg || 'Organisasi';

    const wb = XLSX.utils.book_new();

    if (jenis === 'keluar') {
      const where = { ...buildDateWhere(startDate, endDate, 'tanggalMasehi') };
      if (status) where.status = status;

      const data = await prisma.suratKeluar.findMany({
        where,
        include: {
          pembuat:    { select: { namaLengkap: true } },
          sekretaris: { select: { namaLengkap: true } },
          ketua:      { select: { namaLengkap: true } },
        },
        orderBy: { tanggalMasehi: 'asc' },
      });

      const rows = data.map((s, i) => ({
        'No': i + 1,
        'Nomor Surat': s.nomorSurat || '-',
        'Jenis Surat': JENIS_SURAT[s.jenisSurat] || s.jenisSurat,
        'Perihal': s.perihal,
        'Tujuan': (s.tujuanSurat || s.penerimaEksternal || '-').replace(/\n/g, '; '),
        'Tanggal Surat': fmtDate(s.tanggalMasehi),
        'Tanggal Hijriyah': s.tanggalHijriyah || '-',
        'Pembuat': s.pembuat?.namaLengkap || '-',
        'Sekretaris': s.sekretaris?.namaLengkap || '-',
        'Ketua': s.ketua?.namaLengkap || '-',
        'Status': STATUS_KELUAR[s.status] || s.status,
        'Tgl TTD Sekretaris': fmtDate(s.tglTtdSekretaris),
        'Tgl TTD Ketua': fmtDate(s.tglTtdKetua),
        'Penerima Eksternal': s.penerimaEksternal || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      // Set lebar kolom
      ws['!cols'] = [
        {wch:4},{wch:22},{wch:22},{wch:40},{wch:30},{wch:14},{wch:22},
        {wch:20},{wch:20},{wch:20},{wch:20},{wch:18},{wch:18},{wch:25},
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Surat Keluar');

    } else if (jenis === 'masuk') {
      const where = { ...buildDateWhere(startDate, endDate, 'tanggalSurat') };
      if (status) where.status = status;

      const data = await prisma.suratMasuk.findMany({
        where,
        include: {
          uploader:  { select: { namaLengkap: true } },
          disposisi: { include: { penerima: { select: { namaLengkap: true } } } },
        },
        orderBy: { tanggalSurat: 'asc' },
      });

      const rows = data.map((s, i) => ({
        'No': i + 1,
        'Nomor Surat': s.nomorSurat || '-',
        'Pengirim': s.pengirim,
        'Perihal': s.perihal,
        'Tanggal Surat': fmtDate(s.tanggalSurat),
        'Tanggal Diterima': fmtDate(s.tanggalTerima),
        'Status': STATUS_MASUK[s.status] || s.status,
        'Diinput Oleh': s.uploader?.namaLengkap || '-',
        'Disposisi Kepada': s.disposisi.map(d => d.penerima?.namaLengkap).filter(Boolean).join(', ') || '-',
        'Catatan': s.isiSurat || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        {wch:4},{wch:22},{wch:25},{wch:40},{wch:14},{wch:14},
        {wch:14},{wch:20},{wch:35},{wch:30},
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Surat Masuk');
    } else {
      return res.status(400).json({ success: false, message: 'Parameter jenis tidak valid' });
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const label = jenis === 'keluar' ? 'Surat-Keluar' : 'Surat-Masuk';
    const tgl   = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Rekap-${label}-${tgl}.xlsx"`);
    res.send(buf);
  } catch (err) {
    console.error('Export Excel error:', err);
    res.status(500).json({ success: false, message: 'Gagal export Excel' });
  }
};

// ── EXPORT PDF REKAP ──────────────────────────────────────────────────────────
const exportPDF = async (req, res) => {
  try {
    const { jenis, startDate, endDate, status } = req.query;
    const organisasi = await prisma.organisasiProfil.findFirst();
    const namaOrg    = organisasi?.namaOrg    || 'Organisasi';
    const tingkatan  = organisasi?.tingkatanOrg || '';
    const daerah     = organisasi?.daerahOrg  || '';

    const F_REG  = 'Helvetica';
    const F_BOLD = 'Helvetica-Bold';
    const ML = 40, MR = 40, MT = 40;
    const PW = 841.89, PH = 595.28; // A4 landscape
    const CW = PW - ML - MR;

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));

    const drawHeader = (title) => {
      let y = MT;
      // Logo
      const logoPath = organisasi?.logoPath ? path.join(__dirname, '../../', organisasi.logoPath) : null;
      const hasLogo  = logoPath && fs.existsSync(logoPath);
      const logoSz   = 45;
      const textX    = hasLogo ? ML + logoSz + 8 : ML;
      const textW    = hasLogo ? CW - logoSz - 8 : CW;

      if (hasLogo) {
        try {
          const img = doc.openImage(logoPath);
          const ratio = img.width / img.height;
          const dw = ratio >= 1 ? logoSz : logoSz * ratio;
          const dh = ratio >= 1 ? logoSz / ratio : logoSz;
          doc.image(logoPath, ML, y + (logoSz - dh) / 2, { width: dw, height: dh });
        } catch (_) {}
      }

      doc.font(F_BOLD).fontSize(10).fillColor('#166534')
         .text(`${tingkatan} ${namaOrg} ${daerah}`.trim().toUpperCase(), textX, y, { width: textW, align: 'center' });
      y = doc.y + 2;
      if (organisasi?.alamat) {
        doc.font(F_REG).fontSize(7.5).fillColor('#333333')
           .text(organisasi.alamat, textX, y, { width: textW, align: 'center' });
        y = doc.y + 1;
      }
      doc.moveTo(ML, y + 3).lineTo(ML + CW, y + 3).lineWidth(2).strokeColor('#166534').stroke();
      y += 10;

      // Judul rekap
      doc.font(F_BOLD).fontSize(11).fillColor('#000000')
         .text(title, ML, y, { width: CW, align: 'center' });
      y = doc.y + 2;

      // Sub judul periode
      const periode = startDate || endDate
        ? `Periode: ${startDate ? fmtDate(startDate) : '...'} s/d ${endDate ? fmtDate(endDate) : '...'}`
        : 'Semua Periode';
      doc.font(F_REG).fontSize(8).fillColor('#555555')
         .text(periode, ML, y, { width: CW, align: 'center' });
      y = doc.y + 8;
      return y;
    };

    const drawTable = (headers, rows, startY, colWidths) => {
      const PADX = 4, PADY = 3;
      const rowH  = 16;
      const headH = 18;
      let y = startY;

      // Header
      doc.rect(ML, y, CW, headH).fillColor('#e8f5e9').fill();
      let cx = ML;
      headers.forEach((h, i) => {
        doc.font(F_BOLD).fontSize(7.5).fillColor('#000000')
           .text(h, cx + PADX, y + PADY + 1, { width: colWidths[i] - PADX * 2, lineBreak: false });
        cx += colWidths[i];
      });
      doc.rect(ML, y, CW, headH).strokeColor('#888').lineWidth(0.5).stroke();
      cx = ML;
      for (let i = 0; i < colWidths.length - 1; i++) {
        cx += colWidths[i];
        doc.moveTo(cx, y).lineTo(cx, y + headH).strokeColor('#888').lineWidth(0.5).stroke();
      }
      y += headH;

      // Rows
      rows.forEach((row, ri) => {
        // Hitung tinggi baris berdasarkan konten terpanjang
        let maxH = rowH;
        row.forEach((cell, ci) => {
          try {
            doc.font(F_REG).fontSize(7.5);
            const h = doc.heightOfString(String(cell || '-'), { width: colWidths[ci] - PADX * 2 }) + PADY * 2;
            if (h > maxH) maxH = h;
          } catch (_) {}
        });

        // Page break
        if (y + maxH > PH - 30) {
          doc.addPage();
          y = MT;
        }

        if (ri % 2 === 1) doc.rect(ML, y, CW, maxH).fillColor('#f9fafb').fill();
        cx = ML;
        row.forEach((cell, ci) => {
          doc.font(F_REG).fontSize(7.5).fillColor('#000000')
             .text(String(cell || '-'), cx + PADX, y + PADY, { width: colWidths[ci] - PADX * 2, lineGap: 1 });
          cx += colWidths[ci];
        });
        doc.rect(ML, y, CW, maxH).strokeColor('#ccc').lineWidth(0.3).stroke();
        cx = ML;
        for (let i = 0; i < colWidths.length - 1; i++) {
          cx += colWidths[i];
          doc.moveTo(cx, y).lineTo(cx, y + maxH).strokeColor('#ccc').lineWidth(0.3).stroke();
        }
        y += maxH;
      });

      return y;
    };

    if (jenis === 'keluar') {
      const where = { ...buildDateWhere(startDate, endDate, 'tanggalMasehi') };
      if (status) where.status = status;
      const data = await prisma.suratKeluar.findMany({
        where,
        include: {
          pembuat:    { select: { namaLengkap: true } },
          sekretaris: { select: { namaLengkap: true } },
          ketua:      { select: { namaLengkap: true } },
        },
        orderBy: { tanggalMasehi: 'asc' },
      });

      let y = drawHeader('REKAP SURAT KELUAR');

      // Statistik ringkas
      const selesai  = data.filter(s => s.status === 'SELESAI').length;
      const menunggu = data.filter(s => ['MENUNGGU_SEKRETARIS','MENUNGGU_KETUA'].includes(s.status)).length;
      const ditolak  = data.filter(s => ['DITOLAK_SEKRETARIS','DITOLAK_KETUA'].includes(s.status)).length;
      doc.font(F_REG).fontSize(8).fillColor('#333')
         .text(`Total: ${data.length}  |  Selesai: ${selesai}  |  Menunggu TTD: ${menunggu}  |  Ditolak: ${ditolak}`, ML, y, { width: CW, align: 'center' });
      y = doc.y + 6;

      const headers   = ['No','Nomor Surat','Jenis','Perihal','Tujuan','Tgl Surat','Pembuat','Sekretaris','Ketua','Status'];
      const colWidths = [25, 100, 75, 175, 120, 60, 80, 80, 80, 75];
      const rows = data.map((s, i) => [
        i + 1,
        s.nomorSurat || '-',
        JENIS_SURAT[s.jenisSurat] || s.jenisSurat,
        s.perihal,
        (s.tujuanSurat || s.penerimaEksternal || '-').replace(/\n/g, ', '),
        fmtDate(s.tanggalMasehi),
        s.pembuat?.namaLengkap || '-',
        s.sekretaris?.namaLengkap || '-',
        s.ketua?.namaLengkap || '-',
        STATUS_KELUAR[s.status] || s.status,
      ]);
      drawTable(headers, rows, y, colWidths);

    } else if (jenis === 'masuk') {
      const where = { ...buildDateWhere(startDate, endDate, 'tanggalSurat') };
      if (status) where.status = status;
      const data = await prisma.suratMasuk.findMany({
        where,
        include: {
          uploader:  { select: { namaLengkap: true } },
          disposisi: { include: { penerima: { select: { namaLengkap: true } } } },
        },
        orderBy: { tanggalSurat: 'asc' },
      });

      let y = drawHeader('REKAP SURAT MASUK');

      const didisposisi = data.filter(s => s.status === 'DIDISPOSISI').length;
      doc.font(F_REG).fontSize(8).fillColor('#333')
         .text(`Total: ${data.length}  |  Baru: ${data.filter(s=>s.status==='BARU').length}  |  Dibaca: ${data.filter(s=>s.status==='DIBACA').length}  |  Didisposisi: ${didisposisi}`, ML, y, { width: CW, align: 'center' });
      y = doc.y + 6;

      const headers   = ['No','Nomor Surat','Pengirim','Perihal','Tgl Surat','Tgl Terima','Status','Diinput Oleh','Disposisi Kepada'];
      const colWidths = [25, 100, 110, 200, 65, 65, 65, 90, 100];
      const rows = data.map((s, i) => [
        i + 1,
        s.nomorSurat || '-',
        s.pengirim,
        s.perihal,
        fmtDate(s.tanggalSurat),
        fmtDate(s.tanggalTerima),
        STATUS_MASUK[s.status] || s.status,
        s.uploader?.namaLengkap || '-',
        s.disposisi.map(d => d.penerima?.namaLengkap).filter(Boolean).join(', ') || '-',
      ]);
      drawTable(headers, rows, y, colWidths);
    } else {
      return res.status(400).json({ success: false, message: 'Parameter jenis tidak valid' });
    }

    // Nomor halaman
    const range = doc.bufferedPageRange();
    for (let pi = 0; pi < range.count; pi++) {
      doc.switchToPage(range.start + pi);
      doc.font(F_REG).fontSize(7).fillColor('#888')
         .text(`${pi + 1} dari ${range.count}`, ML, PH - 20, { width: CW, align: 'center' });
    }

    doc.end();
    const label = jenis === 'keluar' ? 'Surat-Keluar' : 'Surat-Masuk';
    const tgl   = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rekap-${label}-${tgl}.pdf"`);
    doc.on('end', () => res.send(Buffer.concat(chunks)));
  } catch (err) {
    console.error('Export PDF error:', err);
    res.status(500).json({ success: false, message: 'Gagal export PDF' });
  }
};

module.exports = { getRekapData, exportExcel, exportPDF };
