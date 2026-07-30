import { PrismaClient, Role, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const passwordHash = await bcrypt.hash('Password123!', 10)

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@consignment.com' },
    update: {},
    create: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@consignment.com',
      phone: '+1234567890',
      password: passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
      profile: {
        create: {
          gender: 'Other',
          address: 'Headquarters, Suite 100',
          city: 'Tech City',
          state: 'State',
        },
      },
    },
  })

  // 2. Create Consignor
  const consignor = await prisma.user.upsert({
    where: { email: 'consignor@consignment.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Consignor',
      email: 'consignor@consignment.com',
      phone: '+1234567891',
      password: passwordHash,
      role: Role.CONSIGNOR,
      status: UserStatus.ACTIVE,
      isVerified: true,
      profile: {
        create: {
          address: '123 Supply Ave',
          city: 'Logistics City',
          bankName: 'First National Bank',
          accountNumber: '1234567890',
          accountName: 'John Consignor',
        },
      },
    },
  })

  // 3. Create Consignee
  const consignee = await prisma.user.upsert({
    where: { email: 'consignee@consignment.com' },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'StoreOwner',
      email: 'consignee@consignment.com',
      phone: '+1234567892',
      password: passwordHash,
      role: Role.CONSIGNEE,
      status: UserStatus.ACTIVE,
      isVerified: true,
      profile: {
        create: {
          address: '456 Retail Blvd',
          city: 'Commerce City',
        },
      },
    },
  })

  // 4. Create Initial Categories
  const categoryElectronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Gadgets, devices, and accessories',
    },
  })

  const categoryFashion = await prisma.category.upsert({
    where: { name: 'Fashion & Apparel' },
    update: {},
    create: {
      name: 'Fashion & Apparel',
      description: 'Clothing, shoes, and luxury items',
    },
  })

  // 5. Create Sample Products
  const product1 = await prisma.product.upsert({
    where: { sku: 'SKU-HEADPHONES-01' },
    update: {},
    create: {
      consignorId: consignor.id,
      categoryId: categoryElectronics.id,
      name: 'Wireless Noise-Canceling Headphones',
      description: 'Premium over-ear headphones with active noise cancellation',
      sku: 'SKU-HEADPHONES-01',
      barcode: '890123456789',
      quantity: 25,
      unitPrice: 150.0,
      consignorRate: 70.0,
      consigneeRate: 20.0,
      status: 'AVAILABLE',
    },
  })

  const product2 = await prisma.product.upsert({
    where: { sku: 'SKU-JACKET-01' },
    update: {},
    create: {
      consignorId: consignor.id,
      categoryId: categoryFashion.id,
      name: 'Vintage Leather Jacket',
      description: 'Handcrafted genuine leather jacket',
      sku: 'SKU-JACKET-01',
      barcode: '890123456790',
      quantity: 10,
      unitPrice: 220.0,
      consignorRate: 75.0,
      consigneeRate: 15.0,
      status: 'AVAILABLE',
    },
  })

  console.log('✅ Seeding completed successfully!')
  console.log('Credentials:')
  console.log('  Admin: admin@consignment.com / Password123!')
  console.log('  Consignor: consignor@consignment.com / Password123!')
  console.log('  Consignee: consignee@consignment.com / Password123!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
