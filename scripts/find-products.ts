import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

(async () => {
  const tenantId = 'cmok5qyf10000et7gnr1jn4uw';

  // Find all products by category pattern
  const all = await p.product.findMany({
    where: { tenantId },
    select: { id: true, name: true, sellingPrice: true, gstRate: true, categoryId: true },
    orderBy: { id: 'asc' },
  });

  // Group by category
  const byCat: Record<string, typeof all> = {};
  for (const prod of all) {
    const catId = prod.categoryId;
    if (!byCat[catId]) byCat[catId] = [];
    byCat[catId].push(prod);
  }

  console.log("Total products: " + all.length);
  console.log("");

  for (const [catId, prods] of Object.entries(byCat)) {
    // Get category name
    const cat = await p.category.findUnique({ where: { id: catId }, select: { name: true } });
    const catName = cat ? cat.name : catId;
    console.log("=== " + catName + " (" + prods.length + " products) ===");
    // Print first 15
    for (let i = 0; i < Math.min(prods.length, 15); i++) {
      const prod = prods[i];
      console.log("  " + prod.id + ": " + prod.name + " Rs." + prod.sellingPrice + " GST " + prod.gstRate + "%");
    }
    console.log("");
  }

  await p.$disconnect();
})();
