/**
 * Konversi tanggal Masehi ke Hijriyah
 * Menggunakan algoritma konversi kalender
 */

const BULAN_HIJRIYAH = [
  'Muharram', 'Shafar', 'Rabi\'ul Awwal', 'Rabi\'ul Akhir',
  'Jumadil Awwal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
  'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
];

function toHijriyah(date) {
  const d = new Date(date);
  
  // Algoritma konversi Julian Day Number ke Hijriyah
  const jd = gregorianToJD(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const hijri = jdToHijri(jd);
  
  return {
    day: hijri.day,
    month: hijri.month,
    year: hijri.year,
    monthName: BULAN_HIJRIYAH[hijri.month - 1],
    formatted: `${hijri.day} ${BULAN_HIJRIYAH[hijri.month - 1]} ${hijri.year} H`
  };
}

function gregorianToJD(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function jdToHijri(jd) {
  jd = Math.floor(jd) + 0.5;
  const z = jd - 1948438.5;
  const a = Math.floor(z / 10631);
  const b = z - 10631 * a;
  const c = Math.floor((b - 0.5) / 354.367);
  const d = b - Math.floor(354.367 * c + 0.5);
  const j = Math.floor((d + 0.5) / 29.5);
  
  const year = 30 * a + c + 1;
  const month = j + 1;
  const day = Math.floor(d - 29.5 * j + 0.5);
  
  return { day, month: month > 12 ? 12 : month, year };
}

function formatTanggalLengkap(tanggalMasehi, tanggalHijriyah) {
  const d = new Date(tanggalMasehi);
  const bulanMasehi = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const masehi = `${d.getDate()} ${bulanMasehi[d.getMonth()]} ${d.getFullYear()}`;
  return `${masehi} M / ${tanggalHijriyah}`;
}

module.exports = { toHijriyah, formatTanggalLengkap, BULAN_HIJRIYAH };
