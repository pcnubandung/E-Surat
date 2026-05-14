import { motion } from 'framer-motion'

export default function StatsCard({ title, value, icon: Icon, color = 'green', trend, delay = 0 }) {
  const colors = {
    green: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-100 text-primary-700',
      value: 'text-primary-700',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-700',
      value: 'text-blue-700',
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-100 text-yellow-700',
      value: 'text-yellow-700',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-100 text-red-700',
      value: 'text-red-700',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-100 text-purple-700',
      value: 'text-purple-700',
    },
  }

  const c = colors[color] || colors.green

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`card p-5 ${c.bg} border-0`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${c.value}`}>{value ?? '-'}</p>
          {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.icon}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
