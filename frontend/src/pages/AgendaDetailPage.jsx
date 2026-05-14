import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { agendaAPI, organisasiAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  ArrowLeftIcon, MapPinIcon, CalendarDaysIcon, ClockIcon,
  ArrowDownTrayIcon, QrCodeIcon, UsersIcon, UserGroupIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const KATEGORI_LABEL = { MUSYAWARAH: 'Musyawarah', RAPAT: 'Rapat', PENGAJIAN: 'Pengajian', LAIN_LAIN: 'Lain-lain' }
const TIPE_LABEL = { LURING: 'Luring', DARING: 'Daring', HIBRID: 'Hibrid' }
const METODE_STYLE = {
  APLIKASI: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  FORM: 'bg-blue-100 text-blue-700 border border-blue-200',
}

export default function AgendaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['agenda-detail', id],
    queryFn: () => agendaAPI.getById(id).then(r => r.data.data),
    refetchInterval: 15000, // auto-refresh setiap 15 detik
  })

  const { data: qrData } = useQuery({
    queryKey: ['agenda-qr', id],
    queryFn: () => agendaAPI.getQRCode(id).then(r => r.data),
    enabled: !!id,
  })

  const { data: orgData } = useQuery({
    queryKey: ['organisasi-profil'],
    queryFn: () => organisasiAPI.getProfil().then(r => r.data.data),
  })

  // Helper: load image dari URL ke HTMLImageElement
  const loadImage = (src) => new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

  const downloadQR = async () => {
    if (!qrData?.qrDataUrl) return

    const W = 800
    const H = 1100
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // ── Background gradient hijau-biru ──
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#0f4c2a')
    grad.addColorStop(0.5, '#1a7a40')
    grad.addColorStop(1, '#2d9e5f')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Lingkaran dekoratif
    ctx.save()
    ctx.globalAlpha = 0.08
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(W - 80, -80, 220, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(80, H - 80, 180, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    // ── Logo organisasi (bulat, di tengah atas) ──
    const logoSrc = orgData?.logoPath
      ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/uploads/logos/${orgData.logoPath.split('/').pop()}`
      : '/logo-org.png'
    const logoImg = await loadImage(logoSrc)

    const logoMaxSize = 100
    const logoY = 30

    if (logoImg) {
      // Hitung ukuran proporsional agar tidak terpotong
      const ratio = logoImg.naturalWidth / logoImg.naturalHeight
      let drawW, drawH
      if (ratio >= 1) {
        drawW = logoMaxSize
        drawH = logoMaxSize / ratio
      } else {
        drawH = logoMaxSize
        drawW = logoMaxSize * ratio
      }
      const logoX = W / 2 - drawW / 2
      ctx.drawImage(logoImg, logoX, logoY, drawW, drawH)
    }

    // ── Teks "Scan Disini" ──
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 42px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Scan Disini', W / 2, 185)

    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillText('Scan QR berikut untuk melakukan presensi', W / 2, 220)

    // ── Kotak putih QR Code ──
    const qrSize = 320
    const qrX = W / 2 - qrSize / 2
    const qrY = 250
    const qrPad = 20
    const boxSize = qrSize + qrPad * 2
    const boxX = W / 2 - boxSize / 2
    const boxY = qrY - qrPad

    // Shadow kotak
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 30
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, boxX, boxY, boxSize, boxSize, 20)
    ctx.fill()
    ctx.restore()

    // Sudut bingkai hijau
    const cornerLen = 36
    const cornerThick = 6
    const cornerR = 10
    ctx.strokeStyle = '#1a7a40'
    ctx.lineWidth = cornerThick
    ctx.lineCap = 'round'
    const corners = [
      [boxX + cornerR, boxY + cornerR, 1, 1],
      [boxX + boxSize - cornerR, boxY + cornerR, -1, 1],
      [boxX + cornerR, boxY + boxSize - cornerR, 1, -1],
      [boxX + boxSize - cornerR, boxY + boxSize - cornerR, -1, -1],
    ]
    corners.forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * cornerLen, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + dy * cornerLen); ctx.stroke()
    })

    // Gambar QR
    const qrImg = await loadImage(qrData.qrDataUrl)
    if (qrImg) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    // ── Nama Agenda ──
    const namaY = boxY + boxSize + 50
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 38px system-ui, sans-serif'
    ctx.textAlign = 'center'
    // Wrap teks panjang
    const namaLines = wrapText(ctx, data.namaAgenda, W - 80)
    namaLines.forEach((line, i) => ctx.fillText(line, W / 2, namaY + i * 48))

    // ── Pill tanggal & waktu ──
    const pillY = namaY + namaLines.length * 48 + 20
    const tanggalStr = format(new Date(data.tanggal), 'dd MMMM yyyy', { locale: localeId })
    const waktuStr = `${data.waktuMulai} - ${data.waktuSelesai} ${data.zonaWaktu}`
    const pillText = `${tanggalStr}, ${waktuStr}`

    ctx.font = '20px system-ui, sans-serif'
    const pillW = ctx.measureText(pillText).width + 48
    const pillH = 44
    const pillX = W / 2 - pillW / 2

    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1.5
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
    ctx.fill(); ctx.stroke()
    ctx.restore()

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(pillText, W / 2, pillY + pillH / 2 + 7)

    // ── Garis pemisah ──
    const sepY = pillY + pillH + 36
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(60, sepY); ctx.lineTo(W - 60, sepY); ctx.stroke()

    // ── Panduan presensi (3 langkah) ──
    const steps = [
      { num: '1', label: 'Buka Aplikasi SAFIRA' },
      { num: '2', label: 'Scan Kode QR' },
      { num: '3', label: 'Verifikasi Agenda' },
    ]
    const stepsY = sepY + 30
    const stepSpacing = (W - 120) / steps.length
    steps.forEach((step, i) => {
      const sx = 60 + stepSpacing * i + stepSpacing / 2

      // Lingkaran nomor
      ctx.save()
      ctx.fillStyle = '#22c55e'
      ctx.shadowColor = 'rgba(34,197,94,0.4)'
      ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(sx, stepsY + 18, 18, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(step.num, sx, stepsY + 24)

      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = '17px system-ui, sans-serif'
      ctx.fillText(step.label, sx, stepsY + 52)

      // Panah antar langkah
      if (i < steps.length - 1) {
        const arrowX = sx + stepSpacing / 2
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.font = '18px system-ui, sans-serif'
        ctx.fillText('›', arrowX, stepsY + 24)
      }
    })

    // ── Panduan via Form (baris kedua) ──
    const formSteps = [
      { num: '1', label: 'Scan QR Code' },
      { num: '2', label: 'Isi Form Hadir' },
      { num: '3', label: 'Kirim & Selesai' },
    ]
    const formStepsY = stepsY + 80

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '15px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('atau tanpa login:', W / 2, formStepsY - 8)

    formSteps.forEach((step, i) => {
      const sx = 60 + stepSpacing * i + stepSpacing / 2

      ctx.save()
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(sx, formStepsY + 18, 16, 0, Math.PI * 2)
      ctx.fill(); ctx.stroke()
      ctx.restore()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(step.num, sx, formStepsY + 23)

      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = '15px system-ui, sans-serif'
      ctx.fillText(step.label, sx, formStepsY + 48)

      if (i < formSteps.length - 1) {
        const arrowX = sx + stepSpacing / 2
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = '16px system-ui, sans-serif'
        ctx.fillText('›', arrowX, formStepsY + 23)
      }
    })

    // ── Download ──
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `QR-${data?.namaAgenda || 'agenda'}.png`
    link.click()
    toast.success('Poster QR Code diunduh')
  }

  // Helper: rounded rect
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  // Helper: wrap teks panjang
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
    return lines
  }

  const downloadKehadiran = async () => {
    try {
      const res = await agendaAPI.rekapKehadiranExcel(id)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `Kehadiran-${data?.namaAgenda || 'agenda'}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Rekap kehadiran diunduh')
    } catch { toast.error('Gagal mengunduh rekap') }
  }

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  )
  if (!data) return <div className="p-6 text-center text-gray-400">Agenda tidak ditemukan</div>

  const hadirAplikasi = data.kehadiran?.filter(k => k.metode === 'APLIKASI').length || 0
  const hadirForm = data.kehadiran?.filter(k => k.metode === 'FORM').length || 0
  const totalHadir = data.kehadiran?.length || 0

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/agenda')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors group">
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Kembali ke Agenda
      </button>

      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>
        <div className="relative p-6 md:p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
              {KATEGORI_LABEL[data.kategori]}
            </span>
            <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
              {TIPE_LABEL[data.tipe]}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">{data.namaAgenda}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-green-300 text-xs mb-1 flex items-center gap-1"><BuildingOffice2Icon className="w-3 h-3" />Penyelenggara</p>
              <p className="font-semibold text-sm">{data.penyelenggara}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-green-300 text-xs mb-1 flex items-center gap-1"><MapPinIcon className="w-3 h-3" />Tempat</p>
              <p className="font-semibold text-sm">{data.tempat}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-green-300 text-xs mb-1 flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3" />Tanggal</p>
              <p className="font-semibold text-sm">{format(new Date(data.tanggal), 'dd MMM yyyy', { locale: localeId })}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-green-300 text-xs mb-1 flex items-center gap-1"><ClockIcon className="w-3 h-3" />Waktu</p>
              <p className="font-semibold text-sm">{data.waktuMulai} – {data.waktuSelesai} {data.zonaWaktu}</p>
            </div>
          </div>
          {data.deskripsi && (
            <p className="mt-4 text-green-100 text-sm bg-white/10 rounded-xl p-3">{data.deskripsi}</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Daftar Hadir — 3 kolom (atau full jika bukan admin) */}
        <div className={`${isAdmin ? 'lg:col-span-3' : 'lg:col-span-5'} space-y-4`}>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{totalHadir}</p>
              <p className="text-xs text-gray-500 mt-1">Total Hadir</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{hadirAplikasi}</p>
              <p className="text-xs text-emerald-600 mt-1">Via Aplikasi</p>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{hadirForm}</p>
              <p className="text-xs text-blue-600 mt-1">Via Form</p>
            </div>
          </div>

          {/* Tabel kehadiran */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-green-600" />
                Daftar Hadir
              </h2>
              {isAdmin && totalHadir > 0 && (
                <button onClick={downloadKehadiran} className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  Unduh Excel
                </button>
              )}
            </div>

            {totalHadir === 0 ? (
              <div className="py-12 text-center">
                <UserGroupIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Belum ada peserta yang hadir</p>
                <p className="text-xs text-gray-300 mt-1">Peserta dapat scan QR Code untuk presensi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Nama</th>
                      <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Jabatan / Instansi</th>
                      <th className="text-left px-5 py-3 font-medium">Waktu</th>
                      <th className="text-left px-5 py-3 font-medium">Metode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.kehadiran.map((k, i) => (
                      <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-green-700">
                              {k.user?.fotoProfil
                                ? <img src={k.user.fotoProfil} className="w-full h-full object-cover rounded-full" />
                                : k.namaLengkap?.charAt(0)
                              }
                            </div>
                            <span className="text-sm font-medium text-gray-800">{k.namaLengkap}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 hidden sm:table-cell">
                          {k.jabatan || k.instansi || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 font-mono">
                          {format(new Date(k.waktuHadir), 'HH:mm')}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METODE_STYLE[k.metode]}`}>
                            {k.metode}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* QR Code — hanya admin */}
        {isAdmin && (
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Scan Disini</h2>
            <p className="text-xs text-gray-400 mb-4">Scan QR berikut untuk melakukan presensi</p>

            <div className="flex justify-center mb-4">
              {qrData?.qrDataUrl ? (
                <div className="p-3 border-2 border-gray-100 rounded-2xl bg-white shadow-sm">
                  <img src={qrData.qrDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                  <QrCodeIcon className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>

            <button onClick={downloadQR} className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Unduh QR Code
            </button>

            <div className="mt-4 space-y-2.5">
              {[
                'Buka Aplikasi SAFIRA',
                'Ketuk menu Scan QR dan arahkan pada Kode QR',
                'Konfirmasi, dan kehadiran Anda akan tercatat',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-gray-500">
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peserta diundang */}
          {data.peserta?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-green-600" />
                Peserta Diundang
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-auto font-normal">
                  {data.peserta.length}
                </span>
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.peserta.map(p => (
                  <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary-700">
                      {p.user.fotoProfil
                        ? <img src={p.user.fotoProfil} className="w-full h-full object-cover rounded-full" />
                        : p.user.namaLengkap?.charAt(0)
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.user.namaLengkap}</p>
                      <p className="text-xs text-gray-400 truncate">{p.user.jabatan || p.user.role}</p>
                    </div>
                    {data.kehadiran?.some(k => k.userId === p.userId) && (
                      <span className="ml-auto text-emerald-500 flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
