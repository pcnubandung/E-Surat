const { generateSuratPDF } = require('./src/utils/pdfGenerator');

const mockSurat = {
  id: 'test-123',
  nomorSurat: '002/A/PC-FNU/V/2026',
  jenisSurat: 'A',
  perihal: 'Undangan Rapat',
  lampiran: '1 (Satu Lembar)',
  isiSurat: `<p>السلام عليكم ورحمة الله وبركاته</p><p>Salam silaturahmi kami sampaikan, semoga kita senantiasa dalam lindungan Allah SWT, dan diberi kekuatan serta <em>istiqâmah</em> dalam berkhidmah untuk agama dan tanah air. <em>Âmîn yâ rabbal 'âlamîn.</em></p><p>Sehubungan akan dilaksanakannya <strong>Rapat Koordinasi PC Fatayat NU Kota Bandung</strong>, kami mengundang Bapak/Ibu untuk hadir pada:</p><table><thead><tr><th>Hari, Tanggal</th><th>Waktu</th><th>Tempat</th></tr></thead><tbody><tr><td>Kamis, 23 Mei 2024 M./15 Dzulqaidah 1445 H.</td><td>Pukul 09.00-15.00 WIB</td><td>Kantor PCNU Kota Bandung, Jl. Sancang No. 8 Kota Bandung</td></tr></tbody></table><p>Demikian undangan ini kami sampaikan. Atas segala perhatian Bapak/Ibu kami haturkan terima kasih. <em>Jazâkumullâh ahsanal jazâ'.</em></p><p style="text-align:center;">والله الموفق الى أقوم الطريق</p><p style="text-align:center;">والسلام عليكم ورحمة الله وبركاته</p>`,
  lampiranIsi: `<p style="text-align: center"><strong>SUSUNAN ACARA</strong></p><table><thead><tr><th>Waktu</th><th>Acara</th><th>Pengisi Acara/Keterangan</th></tr></thead><tbody><tr><td>09.30 – 10.00</td><td>Registrasi Peserta</td><td>Kesekretariatan</td></tr><tr><td>10.00 – 10.05</td><td>Pembukaan</td><td>MC</td></tr><tr><td>10.50 – 11.00</td><td>Tutup dan Ramah Tamah</td><td></td></tr></tbody></table>`,
  tujuanSurat: 'Pengurus PC Fatayat NU Kota Bandung',
  tanggalMasehi: new Date('2026-05-08'),
  tanggalHijriyah: "21 Dzulqa'dah 1447 H",
  tempatTerbit: 'Bandung',
  status: 'SELESAI',
  qrCodeToken: 'test-token-abc123',
  sekretaris: { namaLengkap: 'Siti Aminah', jabatan: 'Sekretaris Umum' },
  ketua:      { namaLengkap: 'Hj. Fatimah Zahra', jabatan: 'Ketua Umum' },
  pembuat:    { namaLengkap: 'Administrator' },
  penerimaInternal: [],
};

const mockOrganisasi = {
  tingkatanOrg: 'Pimpinan Cabang',
  namaOrg:      'Fatayat Nahdlatul Ulama',
  daerahOrg:    'Kota Bandung',
  alamat:       'Jl. Sancang No. 8 Kel. Burangrang, Kec. Lengkong, Kota Bandung 40262',
  telepon:      '+6285295361348',
  email:        'info@fatayatnukotabandung.or.id',
  website:      'www.fatayatnukotabandung.or.id',
  logoPath:     'uploads/logos/logo-1777995226920.png',
};

generateSuratPDF(mockSurat, mockOrganisasi)
  .then(({ filepath }) => { console.log('OK:', filepath); process.exit(0); })
  .catch(err => { console.error('ERROR:', err.message, '\n', err.stack); process.exit(1); });
