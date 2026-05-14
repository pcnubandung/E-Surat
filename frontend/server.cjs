const express = require('express')
const path = require('path')
const fs = require('fs')
const app = express()

const PORT = process.env.PORT || 3000

// Cari folder dist — coba beberapa kemungkinan path
const possiblePaths = [
  path.join(__dirname, 'dist'),
  path.join(process.cwd(), 'dist'),
  '/app/dist',
]

let distPath = null
for (const p of possiblePaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    distPath = p
    break
  }
}

console.log('__dirname:', __dirname)
console.log('cwd:', process.cwd())
console.log('distPath found:', distPath)

if (!distPath) {
  console.error('ERROR: dist folder not found!')
  process.exit(1)
}

// Serve static files dengan MIME type eksplisit
app.use(express.static(distPath, {
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8')
    }
  }
}))

// SPA fallback
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`)
  console.log(`Serving from: ${distPath}`)
})
