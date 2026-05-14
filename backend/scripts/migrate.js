#!/usr/bin/env node
/**
 * Script untuk menjalankan prisma generate + migrate deploy
 * tanpa bergantung pada binary prisma (menghindari permission issue di Railway)
 */
const { execSync } = require('child_process');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

try {
  // Gunakan node langsung ke CLI prisma tanpa binary
  run('node node_modules/prisma/build/index.js generate');
  run('node node_modules/prisma/build/index.js migrate deploy');
  console.log('\n✅ Prisma setup selesai\n');
} catch (err) {
  console.error('❌ Prisma setup gagal:', err.message);
  process.exit(1);
}
