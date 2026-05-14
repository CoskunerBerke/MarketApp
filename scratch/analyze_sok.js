const fs = require('fs');
const html = fs.readFileSync('scratch/sok_live.html', 'utf8');

// Find all classes that look like they belong to product cards
const classes = html.match(/class="([^"]*)"/g) || [];
const uniqueClasses = [...new Set(classes)].filter(c => c.toLowerCase().includes('product') || c.toLowerCase().includes('card') || c.toLowerCase().includes('price'));

console.log('--- Relevant Classes Found ---');
uniqueClasses.forEach(c => console.log(c));

// Also check for NEXT_DATA hydration
if (html.includes('__NEXT_DATA__')) {
  console.log('\n--- NEXT_DATA found! ---');
}
