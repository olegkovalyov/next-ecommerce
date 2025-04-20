import { PrismaClient } from '@prisma/client';
import sampleData from './sample-data';

async function main() {
  const prisma = new PrismaClient();

  // Clear all tables in the correct order (due to foreign key constraints)
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = await prisma.user.createMany({ data: sampleData.users });
  console.log('Created users:', users);

  // Create products
  const products = await prisma.product.createMany({ data: sampleData.products });
  console.log('Created products:', products);

  // Get created users and products
  const [adminUser, regularUser] = await prisma.user.findMany();
  const createdProducts = await prisma.product.findMany();

  // Create carts for users
  const adminCart = await prisma.cart.create({
    data: {
      userId: adminUser.id,
    },
  });

  const userCart = await prisma.cart.create({
    data: {
      userId: regularUser.id,
    },
  });

  // Add some items to admin's cart
  await prisma.cartItem.createMany({
    data: [
      {
        cartId: adminCart.id,
        productId: createdProducts[0].id,
        quantity: 2,
      },
      {
        cartId: adminCart.id,
        productId: createdProducts[1].id,
        quantity: 1,
      },
    ],
  });

  // Add some items to regular user's cart
  await prisma.cartItem.createMany({
    data: [
      {
        cartId: userCart.id,
        productId: createdProducts[2].id,
        quantity: 1,
      },
      {
        cartId: userCart.id,
        productId: createdProducts[3].id,
        quantity: 3,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  });
