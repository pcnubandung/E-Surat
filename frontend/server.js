const express = require('express')
const path = require('path')
const app = express()

const PORT = process.env.PORT || 3000

// Serve static files dari dist dengan MIME type yang benar
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript')
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css')
    }
  }
}))

// SPA fallback — semua route ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`)
})
