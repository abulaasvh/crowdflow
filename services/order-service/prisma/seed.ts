import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const menuItems = [
    {
      name: 'Stadium Hot Dog',
      description: 'Classic oversized beef frank on a toasted bun with mustard and onions.',
      price: 8.50,
      category: 'FOOD',
      imageUrl: 'https://images.unsplash.com/photo-1541214113241-21578d2d9b62?auto=format&fit=crop&q=80&w=200&h=200',
    },
    {
      name: 'Loaded Nachos',
      description: 'Crispy corn chips with warm cheese sauce, jalapeños, and pico de gallo.',
      price: 12.00,
      category: 'FOOD',
    },
    {
      name: 'Large Cola',
      description: 'Refreshing fountain drink (32oz).',
      price: 6.50,
      category: 'DRINK',
    },
    {
      name: 'Craft Beer',
      description: 'Local IPA served in a souvenir cup.',
      price: 14.00,
      category: 'DRINK',
    },
    {
      name: 'Team Jersey',
      description: 'Official home team replica jersey.',
      price: 85.00,
      category: 'MERCH',
    },
  ];

  console.log('🌱 Seeding Menu Items...');

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: 'dummy' }, // This won't match but we use create primarily
      update: {},
      create: item,
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
