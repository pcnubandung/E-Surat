import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { organisasiAPI } from '../services/api'

/**
 * Hook untuk mengupdate favicon dan title halaman
 * secara dinamis berdasarkan profil organisasi.
 */
export function useDynamicFavicon() {
  const { data: orgData } = useQuery({
    queryKey: ['organisasi-public'],
    queryFn: () => organisasiAPI.getProfil().then(r => r.data.data),
    staleTime: 5 * 60 * 1000, // 5 menit
  })

  useEffect(() => {
    if (!orgData) return

    // Update title
    const namaOrg = orgData.namaOrg || 'SAFIRA'
    document.title = `${namaOrg} - Sistem Administrasi Persuratan`

    // Update favicon jika ada logo
    if (orgData.logoPath) {
      setFavicon(orgData.logoPath)
    }
  }, [orgData])
}

function setFavicon(url) {
  // Hapus semua link favicon yang ada
  const existing = document.querySelectorAll('link[rel*="icon"]')
  existing.forEach(el => el.parentNode.removeChild(el))

  // Buat link favicon baru
  const link = document.createElement('link')
  link.rel  = 'icon'
  link.href = url
  // Deteksi tipe dari ekstensi
  const ext = url.split('.').pop()?.toLowerCase()
  link.type = ext === 'svg' ? 'image/svg+xml'
    : ext === 'png'  ? 'image/png'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'ico'  ? 'image/x-icon'
    : 'image/png'

  document.head.appendChild(link)
}
