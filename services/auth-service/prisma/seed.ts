import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Auth Service...');

  // 1. Create Demo Staff User
  const staffHash = await argon2.hash('staff_secret_123');
  const staff = await prisma.user.upsert({
    where: { email: 'staff@crowdflow.io' },
    update: {},
    create: {
      email: 'staff@crowdflow.io',
      password: staffHash,
      displayName: 'Demo Staff',
      role: 'STAFF',
      preferences: {
        create: {
          language: 'en',
          notifications: true,
        },
      },
    },
  });
  console.log('✅ Created staff user: staff@crowdflow.io / staff_secret_123');

  // 2. Create Demo Attendee User
  const userHash = await argon2.hash('fan_secret_456');
  const fan = await prisma.user.upsert({
    where: { email: 'fan@stadium.com' },
    update: {},
    create: {
      email: 'fan@stadium.com',
      password: userHash,
      displayName: 'John Fan',
      role: 'ATTENDEE',
      preferences: {
        create: {
          language: 'en',
          accessibility: 'NONE',
          dietary: 'NONE',
          notifications: true,
        },
      },
    },
  });
  console.log('✅ Created attendee user: fan@stadium.com / fan_secret_456');

  console.log('✨ Auth seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
