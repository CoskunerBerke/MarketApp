const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('scratch/sok_live.html', 'utf8');
const $ = cheerio.load(html);

const productWrappers = $('[class*="CProductCard-module_productCardWrapper"]').toArray();
console.log('Total wrappers found:', productWrappers.length);

productWrappers.slice(0, 3).forEach((el, i) => {
  const title = $(el).find('[class*="CProductCard-module_title"]').text().trim();
  const priceText = $(el).find('[class*="CPriceBox-module_price"]').first().text().trim();
  console.log(`Product ${i+1}: ${title} - ${priceText}`);
});
