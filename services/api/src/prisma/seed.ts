import { prisma } from './client';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: ['*'],
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Standard user with read access',
      permissions: ['hello:read'],
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: {
      name: 'editor',
      description: 'Editor with read and write access',
      permissions: ['hello:read', 'hello:write'],
    },
  });

  console.log('✅ Roles created:', { adminRole, userRole, editorRole });

  // Create sample HelloEntities
  const sampleEntities = [
    {
      name: 'Welcome Entity',
      description: 'A sample entity to get started',
      isActive: true,
      metadata: { category: 'sample', priority: 'high' },
    },
    {
      name: 'Test Entity',
      description: 'Another sample for testing',
      isActive: true,
      metadata: { category: 'test', priority: 'medium' },
    },
    {
      name: 'Inactive Entity',
      description: 'This entity is inactive',
      isActive: false,
      metadata: { category: 'archived' },
    },
  ];

  for (const entity of sampleEntities) {
    await prisma.helloEntity.upsert({
      where: { name: entity.name },
      update: {},
      create: entity,
    });
  }

  console.log('✅ Sample HelloEntities created');

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
