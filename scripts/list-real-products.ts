import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

(async () => {
  // Get products with their categories from the actual database
  // Using the tenantId from the superstore user
  const tenantId = 'cmok5qyf10000et7gnr1jn4uw';
  
  // Get all products for this tenant
  const products = await p.product.findMany({
    where: { tenantId },
    select: { id: true, name: true, sellingPrice: true, gstRate: true, categoryId: true },
    take: 100,
  });
  
  // Group by categoryId prefix pattern (clothing, electronics, groceries)
  for (const p of products.slice(0, 50)) {
    console.log(`  { id: '${p.id}', name: '${p.name.replace(/'/g, "\\'")}', category: 'unknown', sellingPrice: ${p.sellingPrice}, gstRate: ${p.gstRate} },`);
  }

  await p.$disconnect();
})();
