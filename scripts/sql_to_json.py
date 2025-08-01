#!/usr/bin/env python3
"""
Convert mass_import_fixed.sql to JSON files for JavaScript importer
"""

import re
import json
import os
from pathlib import Path

def extract_products_from_sql(sql_file_path):
    """Extract product data from SQL INSERT statements"""
    products = []
    
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Find all INSERT statements
    insert_pattern = r"INSERT INTO products.*?VALUES\s*\((.*?)\)\s*ON CONFLICT"
    matches = re.findall(insert_pattern, sql_content, re.DOTALL | re.IGNORECASE)
    
    print(f"Found {len(matches)} INSERT statements")
    
    for i, match in enumerate(matches):  # Process ALL products
        try:
            # Parse VALUES content
            values = match.strip()
            
            # Split by comma but respect quoted strings
            parts = []
            current_part = ""
            in_quotes = False
            escape_next = False
            
            for char in values:
                if escape_next:
                    current_part += char
                    escape_next = False
                elif char == '\\':
                    current_part += char
                    escape_next = True
                elif char == "'" and not escape_next:
                    current_part += char
                    in_quotes = not in_quotes
                elif char == ',' and not in_quotes:
                    parts.append(current_part.strip())
                    current_part = ""
                else:
                    current_part += char
            
            if current_part.strip():
                parts.append(current_part.strip())
            
            if len(parts) >= 17:  # Minimum required fields
                # Clean up values
                clean_parts = []
                for part in parts:
                    part = part.strip()
                    if part.startswith("'") and part.endswith("'"):
                        part = part[1:-1]
                    elif part == 'NULL':
                        part = None
                    elif part == 'true':
                        part = True
                    elif part == 'false':
                        part = False
                    else:
                        try:
                            if '.' in part:
                                part = float(part)
                            else:
                                part = int(part)
                        except ValueError:
                            pass
                    clean_parts.append(part)
                
                # Map to product structure
                product = {
                    "kod_produktu": clean_parts[0],
                    "nazwa_produktu": clean_parts[1], 
                    "jednostka_sprzedażowa": clean_parts[4],  # selling_unit
                    "nieoficjalna_nazwa_produktu": clean_parts[6],
                    "rodzaj_wykończenia": clean_parts[7],
                    "powierzchnia": clean_parts[8],
                    "fazowanie": clean_parts[9],
                    "grubość_[mm]": str(clean_parts[10]) if clean_parts[10] is not None else None,
                    "szerokość_[mm]": str(clean_parts[11]) if clean_parts[11] is not None else None,
                    "długość_[mm]": str(clean_parts[12]) if clean_parts[12] is not None else None,
                    "paczka_[m²]": str(clean_parts[13]) if clean_parts[13] is not None else None,
                    "dodatkowy_opis_przedmiotu": clean_parts[14],
                    "cena_detaliczna_netto_1{}_[zł]".format(clean_parts[4]): str(clean_parts[15]) if clean_parts[15] is not None else None,
                    "cena_sprzedaży_netto_1{}_[zł]".format(clean_parts[4]): str(clean_parts[16]) if clean_parts[16] is not None else None,
                    "cena_zakupu_netto_1{}_[zł]".format(clean_parts[4]): str(clean_parts[17]) if clean_parts[17] is not None else None,
                    "potencjalny_zysk_1{}_[zł]".format(clean_parts[4]): str(clean_parts[18]) if clean_parts[18] is not None else None,
                    "długość_sprzedażowa_[mb]": str(clean_parts[5]) if clean_parts[5] is not None else None
                }
                
                # Clean up None values
                product = {k: v for k, v in product.items() if v is not None}
                
                products.append(product)
                
        except Exception as e:
            print(f"Error parsing product {i}: {e}")
            continue
    
    return products

def create_json_files(products, output_dir, batch_size=200):
    """Create JSON files with batches of products"""
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    for i in range(0, len(products), batch_size):
        batch = products[i:i + batch_size]
        filename = f"products_batch_{i//batch_size + 1:04d}.json"
        filepath = output_path / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(batch, f, indent=2, ensure_ascii=False)
        
        print(f"Created {filename} with {len(batch)} products")

def main():
    sql_file = "mass_import_fixed.sql"
    output_dir = "extracted_products"
    
    if not os.path.exists(sql_file):
        print(f"❌ SQL file not found: {sql_file}")
        return
    
    print("🚀 Extracting products from SQL...")
    products = extract_products_from_sql(sql_file)
    
    print(f"✅ Extracted {len(products)} products")
    
    if products:
        print("📄 Creating JSON files...")
        create_json_files(products, output_dir, batch_size=100)
        print(f"🎯 JSON files created in {output_dir}/")
        
        # Show sample
        print("\n📋 Sample product:")
        print(json.dumps(products[0], indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()