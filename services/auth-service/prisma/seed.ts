import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default institutions
  const instA = await prisma.institution.upsert({
    where: { id: 'inst-a-id-12345' },
    update: {},
    create: {
      id: 'inst-a-id-12345',
      name: 'University A',
    },
  });

  const instB = await prisma.institution.upsert({
    where: { id: 'inst-b-id-67890' },
    update: {},
    create: {
      id: 'inst-b-id-67890',
      name: 'University B',
    },
  });

  // Hashing password "secure_admin_password_123" via Argon2id
  const passwordHash = await argon2.hash('secure_admin_password_123', { type: argon2.argon2id });

  // Create default users
  await prisma.user.upsert({
    where: {
      email_institutionId: {
        email: 'admin@uni-a.edu',
        institutionId: instA.id,
      },
    },
    update: {},
    create: {
      email: 'admin@uni-a.edu',
      passwordHash,
      role: Role.INSTITUTION_ADMIN,
      institutionId: instA.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: {
      email_institutionId: {
        email: 'admin@uni-b.edu',
        institutionId: instB.id,
      },
    },
    update: {},
    create: {
      email: 'admin@uni-b.edu',
      passwordHash,
      role: Role.INSTITUTION_ADMIN,
      institutionId: instB.id,
      isActive: true,
    },
  });

  // Create a SUPER_ADMIN user
  // For super admins we can map to a default dummy institution or a dedicated system tenant.
  const sysInst = await prisma.institution.upsert({
    where: { id: 'system-tenant-id' },
    update: {},
    create: {
      id: 'system-tenant-id',
      name: 'System Tenant',
    },
  });

  await prisma.user.upsert({
    where: {
      email_institutionId: {
        email: 'superadmin@securecbt.com',
        institutionId: sysInst.id,
      },
    },
    update: {},
    create: {
      email: 'superadmin@securecbt.com',
      passwordHash,
      role: Role.SUPER_ADMIN,
      institutionId: sysInst.id,
      isActive: true,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
