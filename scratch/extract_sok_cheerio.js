const fs = require('fs');
const cheerio = require('cheerio');

const content = fs.readFileSync('scratch/sok_target.html', 'utf8');
const $ = cheerio.load(content);

const products = [];
$('[class*="CProductCard-module_productCardWrapper"]').each((i, el) => {
    if (i >= 10) return;
    const title = $(el).find('[class*="CProductCard-module_title"]').text().trim();
    const priceText = $(el).find('[class*="CPriceBox-module_price"]').text().trim();
    const imageUrl = $(el).find('img').attr('src');
    const promo = $(el).find('[class*="CProductCard-module_promotionBadgeContainer"]').text().trim();

    products.push({
        title,
        price: priceText,
        imageUrl,
        promotion: promo
    });
});

console.log(JSON.stringify(products, null, 2));
