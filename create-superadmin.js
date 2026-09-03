const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  let superadminCompany = await prisma.company.findFirst({
    where: { name: 'Superadmin HQ' }
  });

  if (!superadminCompany) {
    superadminCompany = await prisma.company.create({
      data: {
        name: 'Superadmin HQ',
      }
    });
  }

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@sigma.com' },
    update: {
      password: hashedPassword,
      role: 'SUPERADMIN',
      companyId: superadminCompany.id,
    },
    create: {
      email: 'superadmin@sigma.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPERADMIN',
      companyId: superadminCompany.id,
    },
  });

  console.log('Superadmin created:', superadmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
