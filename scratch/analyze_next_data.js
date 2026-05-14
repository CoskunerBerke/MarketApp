const fs = require('fs');
const html = fs.readFileSync('scratch/sok_live.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (match) {
  const data = JSON.parse(match[1]);
  // Explore the data structure
  const pageProps = data.props.pageProps;
  const components = pageProps.initialState?.cms?.components || [];
  
  console.log('Components found:', components.length);
  
  // Look for product lists
  const productList = components.find(c => c.type === 'PRODUCT_LIST');
  if (productList) {
    console.log('Product list found with', productList.data?.products?.length, 'products');
    console.log('Sample product:', JSON.stringify(productList.data?.products[0], null, 2));
  } else {
    // Check for another path
    console.log('Searching for products in components...');
    components.forEach(comp => {
      if (comp.data && comp.data.products) {
         console.log('Found products in component type:', comp.type, 'count:', comp.data.products.length);
      }
    });
  }
} else {
  console.log('__NEXT_DATA__ not found');
}
