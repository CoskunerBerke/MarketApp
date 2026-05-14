import re
with open(r'c:\Users\berke\OneDrive\Masaüstü\Market\bim_home.html', 'r', encoding='utf-8') as f:
    content = f.read()
    matches = re.findall(r'class="product', content)
    print(f"Total products found: {len(matches)}")
    
    # Also count how many have LoadGroup
    load_groups = re.findall(r'LoadGroup\d+', content)
    print(f"Products with LoadGroup: {len(load_groups)}")
    
    # Count justImage
    just_images = re.findall(r'justImage', content)
    print(f"JustImage products: {len(just_images)}")
