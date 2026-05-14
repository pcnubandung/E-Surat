const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Buat profil organisasi default
  const existingProfil = await prisma.organisasiProfil.findFirst();
  if (!existingProfil) {
    await prisma.organisasiProfil.create({
      data: {
        tingkatanOrg: 'Pimpinan Cabang',
        namaOrg:      'Fatayat Nahdlatul Ulama',
        daerahOrg:    'Kota Bandung',
        alamat:  'Jl. Sancang No. 8 Kel. Burangrang, Kec. Lengkong, Kota Bandung 40262',
        telepon: '+6285295361348',
        email:   'info@fatayatnukotabandung.or.id',
        website: 'www.fatayatnukotabandung.or.id',
      },
    });
    console.log('✅ Profil organisasi default dibuat');
  }

  // Buat admin default
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@safira.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        email: 'admin@safira.com',
        password: hashedPassword,
        namaLengkap: 'Administrator',
        jabatan: 'Administrator Sistem',
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin default dibuat: admin@safira.com / admin123');
  }

  // Buat user contoh
  const users = [
    {
      email: 'sekretaris@safira.com',
      namaLengkap: 'Siti Aminah',
      jabatan: 'Sekretaris Umum',
      role: 'SEKRETARIS',
    },
    {
      email: 'ketua@safira.com',
      namaLengkap: 'Hj. Fatimah Zahra',
      jabatan: 'Ketua Umum',
      role: 'KETUA',
    },
    {
      email: 'pengurus1@safira.com',
      namaLengkap: 'Nur Hidayah',
      jabatan: 'Bendahara',
      role: 'PENGURUS',
    },
    {
      email: 'pengurus2@safira.com',
      namaLengkap: 'Aisyah Putri',
      jabatan: 'Koordinator Bidang Pendidikan',
      role: 'PENGURUS',
    },
  ];

  for (const userData of users) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      console.log(`✅ User dibuat: ${userData.email} / password123`);
    }
  }

  console.log('🎉 Seeding selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
