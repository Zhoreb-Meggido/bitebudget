const fs = require('fs');

const backupPath = process.argv[2];
const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('=== Backup File Analysis ===');
console.log('Total entries in file:', data.entries?.length || 0);
console.log('Total products in file:', data.products?.length || 0);
console.log('Total weights in file:', data.weights?.length || 0);
console.log('Total productPortions in file:', data.productPortions?.length || 0);
console.log('Total mealTemplates in file:', data.mealTemplates?.length || 0);

// Check for deleted items
const deletedEntries = data.entries?.filter(e => e.deleted === true) || [];
const deletedProducts = data.products?.filter(p => p.deleted === true) || [];
const deletedPortions = data.productPortions?.filter(p => p.deleted === true) || [];
const deletedTemplates = data.mealTemplates?.filter(t => t.deleted === true) || [];

console.log('\n=== Soft-deleted items IN BACKUP ===');
console.log('Deleted entries:', deletedEntries.length);
console.log('Deleted products:', deletedProducts.length);
console.log('Deleted portions:', deletedPortions.length);
console.log('Deleted templates:', deletedTemplates.length);

// Active items
const activeEntries = data.entries?.filter(e => !e.deleted) || [];
const activeProducts = data.products?.filter(p => !p.deleted) || [];

console.log('\n=== Active items IN BACKUP ===');
console.log('Active entries:', activeEntries.length);
console.log('Active products:', activeProducts.length);

// Show examples of deleted items if any
if (deletedEntries.length > 0) {
  console.log('\n=== Sample deleted entries ===');
  deletedEntries.slice(0, 3).forEach((e, i) => {
    console.log(`${i + 1}. ID: ${e.id}, Date: ${e.date}, Deleted: ${e.deleted}, Deleted_at: ${e.deleted_at}`);
  });
}

if (deletedProducts.length > 0) {
  console.log('\n=== Sample deleted products ===');
  deletedProducts.slice(0, 3).forEach((p, i) => {
    console.log(`${i + 1}. ID: ${p.id}, Name: ${p.name}, Deleted: ${p.deleted}, Deleted_at: ${p.deleted_at}`);
  });
}
