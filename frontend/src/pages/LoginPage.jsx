import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authAPI, organisasiAPI, getUploadUrl } from '../services/api'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const { data: orgData } = useQuery({
    queryKey: ['organisasi-public'],
    queryFn: () => organisasiAPI.getProfil().then(r => r.data.data),
    staleTime: 60000,
  })

  const loginMutation = useMutation({
    mutationFn: (data) => authAPI.login(data),
    onSuccess: (res) => {
      const { user, token } = res.data.data
      setAuth(user, token)
      toast.success(`Assalamu'alaikum, ${user.namaLengkap}!`)
      navigate('/dashboard')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login gagal')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Email dan password harus diisi')
      return
    }
    loginMutation.mutate(form)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-emerald-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 flex items-center justify-center mx-auto mb-4"
            >
              {orgData?.logoPath ? (
                <img src={getUploadUrl(orgData.logoPath)} alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-4xl">S</span>
                </div>
              )}
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1">SAFIRA</h1>
            <p className="text-primary-200 text-sm">Smart Fatayat untuk Informasi Risalah dan Administrasi</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Masuk ke Sistem</h2>
            <p className="text-sm text-gray-500 mb-6">Masukkan Kredensial Anda untuk Melanjutkan</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loginMutation.isPending}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full btn-primary justify-center py-3 text-base rounded-xl mt-2"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : 'Masuk'}
              </motion.button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-primary-200 text-xs mt-6">
          SAFIRA © {new Date().getFullYear()} — Smart Fatayat untuk Informasi Risalah dan Administrasi
        </p>
      </motion.div>
    </div>
  )
}
