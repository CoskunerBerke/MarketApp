const fs = require('fs');

const content = fs.readFileSync('scratch/sok_target.html', 'utf8');
const matches = content.match(/self\.__next_f\.push\(\[1,"(.*)"\]\)/g);

if (!matches) {
    console.log("No Next data found");
    process.exit(1);
}

matches.forEach((match, idx) => {
    try {
        // Search for all occurrences of name and price inside the push string
        const innerMatch = match.match(/self\.__next_f\.push\(\[1,\"(.*)\"\]\)/);
        if (!innerMatch) return;
        const data = innerMatch[1].replace(/\\\"/g, '"').replace(/\\\\/g, '\\');
        
        // Find all JSON-like chunks
        // Example: {"id":123,"name":"Product Name","price":99.9...}
        const productRegex = /\"id\":(\d+),\"code\":\"(.*?)\",\"name\":\"(.*?)\",\"price\":(\d+\.?\d*)/g;
        let p;
        while ((p = productRegex.exec(data)) !== null) {
            console.log(`PRODUCT: ${p[3]} | PRICE: ${p[4]} | CODE: ${p[2]}`);
        }
    } catch (e) {
        // console.log(e);
    }
});
