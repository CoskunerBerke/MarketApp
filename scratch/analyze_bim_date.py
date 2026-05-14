import re
with open(r'c:\Users\berke\OneDrive\Masaüstü\Market\bim_date_page.html', 'r', encoding='utf-8') as f:
    content = f.read()
    matches = re.findall(r'class="product', content)
    print(f"Total products found in date page: {len(matches)}")
    
    load_groups = re.findall(r'LoadGroup\d+', content)
    print(f"Products with LoadGroup: {len(load_groups)}")
