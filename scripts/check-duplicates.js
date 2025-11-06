/**
 * Check for duplicate portions in IndexedDB
 * Run this in browser console to detect duplicates
 */

console.log('🔍 Checking for duplicate portions...');

// Open IndexedDB
const request = indexedDB.open('VoedseljournaalDB', 7);

request.onerror = () => {
  console.error('❌ Failed to open database');
};

request.onsuccess = (event) => {
  const db = event.target.result;
  const tx = db.transaction('productPortions', 'readonly');
  const store = tx.objectStore('productPortions');
  const getAllRequest = store.getAll();

  getAllRequest.onsuccess = () => {
    const allPortions = getAllRequest.result;
    console.log(`📊 Total portions in DB: ${allPortions.length}`);

    // Group by composite key (productName + portionName)
    const grouped = new Map();

    allPortions.forEach(portion => {
      const key = `${portion.productName}|||${portion.portionName}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(portion);
    });

    // Find duplicates
    const duplicates = [];
    grouped.forEach((portions, key) => {
      if (portions.length > 1) {
        duplicates.push({ key, count: portions.length, portions });
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found! All portions are unique.');
      console.log(`📦 You have ${grouped.size} unique portion definitions across ${allPortions.length} total records.`);
    } else {
      console.log(`⚠️ Found ${duplicates.length} duplicate groups:`);
      console.log('');

      duplicates.forEach(({ key, count, portions }) => {
        const [productName, portionName] = key.split('|||');
        console.log(`🔴 "${productName}" - "${portionName}" (${count} copies):`);
        portions.forEach((p, index) => {
          console.log(`   ${index + 1}. ID: ${p.id}, Created: ${p.created_at}, Updated: ${p.updated_at}`);
        });
        console.log('');
      });

      console.log(`\n💡 Total duplicates to remove: ${allPortions.length - grouped.size}`);
    }

    // Show breakdown by product
    console.log('\n📋 Breakdown by product:');
    const byProduct = new Map();
    allPortions.forEach(portion => {
      if (!byProduct.has(portion.productName)) {
        byProduct.set(portion.productName, []);
      }
      byProduct.get(portion.productName).push(portion);
    });

    const sortedProducts = Array.from(byProduct.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);

    console.log('Top 10 products with most portions:');
    sortedProducts.forEach(([product, portions]) => {
      console.log(`  📦 ${product}: ${portions.length} portions`);
    });
  };

  getAllRequest.onerror = () => {
    console.error('❌ Failed to read portions');
  };
};
