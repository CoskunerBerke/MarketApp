const cheerio = require('cheerio');
const fs = require('fs');

const content = fs.readFileSync('C:/Users/berke/OneDrive/Masaüstü/Market/bim_date_page.html', 'utf-8');
const $ = cheerio.load(content);

const names = new Set();
const products = $('.product').toArray();

products.forEach((el, index) => {
    const subTitle = $(el).find('.subTitle').text().trim();
    const title = $(el).find('.title').text().trim();
    const details = $(el).find('.gramajadet').text().trim();
    const fullName = `${subTitle} ${title} ${details}`.trim();
    
    if (fullName) {
        if (names.has(fullName)) {
            console.log(`Duplicate found: "${fullName}" at index ${index}`);
        }
        names.add(fullName);
    }
});

console.log(`Total unique names: ${names.size}`);
console.log(`Total products: ${products.length}`);
