const express = require('express')
const path = require('path')
const fs = require('fs')
const app = express()

const PORT = process.env.PORT || 3000
const distPath = '/app/dist'

console.log('distPath:', distPath)
console.log('index.html exists:', fs.existsSync(path.join(distPath, 'index.html')))
console.log('assets exists:', fs.existsSync(path.join(distPath, 'assets')))

// Log setiap request untuk debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// Serve assets folder secara eksplisit
app.use('/assets', express.static(path.join(distPath, 'assets'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8')
    }
  }
}))

// Serve root static files (favicon, manifest, dll)
app.use(express.static(distPath))

// SPA fallback
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
