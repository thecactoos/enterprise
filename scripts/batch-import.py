#!/usr/bin/env python3
"""
Mass Import Script for SPS Enterprise Products
Processes 2000+ JSON files and imports into PostgreSQL with exact column names
"""

import json
import os
import sys
import re
from pathlib import Path
from datetime import datetime

class ProductBatchImporter:
    def __init__(self, data_directory):
        self.data_directory = Path(data_directory)
        self.stats = {
            'total_files': 0,
            'total_records': 0,
            'successful_transforms': 0,
            'skipped_records': 0,
            'errors': 0,
            'start_time': datetime.now()
        }
        
    def clean_decimal(self, value):
        """Convert Polish decimal format to PostgreSQL format"""
        if not value or value == '':
            return None
        if isinstance(value, (int, float)):
            return float(value)
        
        # Replace comma with dot and clean
        cleaned = str(value).replace(',', '.').strip()
        try:
            return float(cleaned)
        except (ValueError, TypeError):
            return None
    
    def clean_string(self, value):
        """Clean string for SQL insertion"""
        if not value or value == '':
            return None
        # Escape single quotes for SQL
        return str(value).replace("'", "''")
    
    def extract_pricing_unit(self, data):
        """Extract pricing unit from field names"""
        price_fields = [key for key in data.keys() if 'cena_' in key and '[zł]' in key]
        
        for field in price_fields:
            if '1mb' in field:
                return 'mb'
            elif '1m²' in field or '1m2' in field:
                return 'm²'
            elif '1szt' in field:
                return 'szt'
        
        return data.get('jednostka_sprzedażowa', 'szt')
    
    def transform_to_exact_columns(self, scraped_data):
        """Transform scraped data to your exact column names"""
        selling_unit = scraped_data.get('jednostka_sprzedażowa', 'szt')
        pricing_unit = self.extract_pricing_unit(scraped_data)
        
        # Handle different price field formats
        retail_price = self.clean_decimal(
            scraped_data.get('cena_detaliczna_netto_1mb_[zł]') or 
            scraped_data.get('cena_detaliczna_netto_1m²_[zł]') or
            scraped_data.get('cena_detaliczna_netto_1szt_[zł]')
        )
        
        selling_price = self.clean_decimal(
            scraped_data.get('cena_sprzedaży_netto_1mb_[zł]') or 
            scraped_data.get('cena_sprzedaży_netto_1m²_[zł]') or
            scraped_data.get('cena_sprzedaży_netto_1szt_[zł]')
        )
        
        purchase_price = self.clean_decimal(
            scraped_data.get('cena_zakupu_netto_1mb_[zł]') or 
            scraped_data.get('cena_zakupu_netto_1m²_[zł]') or
            scraped_data.get('cena_zakupu_netto_1szt_[zł]')
        )
        
        potential_profit = self.clean_decimal(
            scraped_data.get('potencjalny_zysk_1mb_[zł]') or 
            scraped_data.get('potencjalny_zysk_1m²_[zł]') or
            scraped_data.get('potencjalny_zysk_1szt_[zł]')
        )
        
        return {
            'product_code': self.clean_string(scraped_data.get('kod_produktu')),
            'product_name': self.clean_string(scraped_data.get('nazwa_produktu', 'Unknown Product')),
            'measure_unit': selling_unit,
            'base_unit_for_pricing': pricing_unit,
            'selling_unit': selling_unit,
            'measurement_units_per_selling_unit': self.clean_decimal(scraped_data.get('długość_sprzedażowa_[mb]')) or 1.0,
            'unofficial_product_name': self.clean_string(scraped_data.get('nieoficjalna_nazwa_produktu')),
            'type_of_finish': self.clean_string(scraped_data.get('rodzaj_wykończenia')),
            'surface': self.clean_string(scraped_data.get('powierzchnia')),
            'bevel': self.clean_string(scraped_data.get('fazowanie')),
            'thickness_mm': self.clean_decimal(scraped_data.get('grubość_[mm]')),
            'width_mm': self.clean_decimal(scraped_data.get('szerokość_[mm]')),  
            'length_mm': self.clean_decimal(scraped_data.get('długość_[mm]')),
            'package_m2': self.clean_decimal(scraped_data.get('paczka_[m²]')),
            'additional_item_description': self.clean_string(scraped_data.get('dodatkowy_opis_przedmiotu')),
            'retail_price_per_unit': retail_price,
            'selling_price_per_unit': selling_price,
            'purchase_price_per_unit': purchase_price,
            'potential_profit': potential_profit,
            'installation_allowance': 0.0,
            'currency': 'PLN',
            'status': 'active',
            'is_active': True,
            'original_scraped_data': json.dumps(scraped_data, ensure_ascii=False)
        }
    
    def generate_sql_insert(self, product_data):
        """Generate SQL INSERT statement with your exact column names"""
        
        def sql_value(value):
            if value is None:
                return 'NULL'
            elif isinstance(value, bool):
                return 'true' if value else 'false'
            elif isinstance(value, (int, float)):
                return str(value)
            else:
                return f"'{value}'"
        
        sql = f"""
INSERT INTO products_complete (
    product_code, product_name, measure_unit, base_unit_for_pricing, selling_unit,
    measurement_units_per_selling_unit, unofficial_product_name, type_of_finish,
    surface, bevel, thickness_mm, width_mm, length_mm, package_m2,
    additional_item_description, retail_price_per_unit, selling_price_per_unit,
    purchase_price_per_unit, potential_profit, installation_allowance,
    currency, status, is_active, original_scraped_data
) VALUES (
    {sql_value(product_data['product_code'])},
    {sql_value(product_data['product_name'])},
    {sql_value(product_data['measure_unit'])},
    {sql_value(product_data['base_unit_for_pricing'])},
    {sql_value(product_data['selling_unit'])},
    {sql_value(product_data['measurement_units_per_selling_unit'])},
    {sql_value(product_data['unofficial_product_name'])},
    {sql_value(product_data['type_of_finish'])},
    {sql_value(product_data['surface'])},
    {sql_value(product_data['bevel'])},
    {sql_value(product_data['thickness_mm'])},
    {sql_value(product_data['width_mm'])},
    {sql_value(product_data['length_mm'])},
    {sql_value(product_data['package_m2'])},
    {sql_value(product_data['additional_item_description'])},
    {sql_value(product_data['retail_price_per_unit'])},
    {sql_value(product_data['selling_price_per_unit'])},
    {sql_value(product_data['purchase_price_per_unit'])},
    {sql_value(product_data['potential_profit'])},
    {sql_value(product_data['installation_allowance'])},
    {sql_value(product_data['currency'])},
    {sql_value(product_data['status'])},
    {sql_value(product_data['is_active'])},
    {sql_value(product_data['original_scraped_data'])}
)
ON CONFLICT (product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    selling_price_per_unit = EXCLUDED.selling_price_per_unit,
    updated_at = CURRENT_TIMESTAMP;
"""
        return sql.strip()
    
    def process_json_file(self, file_path):
        """Process a single JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            
            # Handle different JSON structures
            products = []
            if isinstance(json_data, list):
                products = json_data
            elif isinstance(json_data, dict):
                if 'mergedData' in json_data:
                    if isinstance(json_data['mergedData'], list):
                        products = json_data['mergedData']
                    else:
                        products = [json_data['mergedData']]
                else:
                    products = [json_data]
            
            sql_statements = []
            file_success_count = 0
            
            for product in products:
                # Skip if no product code or name
                if not product.get('kod_produktu') or not product.get('nazwa_produktu'):
                    self.stats['skipped_records'] += 1
                    continue
                
                try:
                    transformed_product = self.transform_to_exact_columns(product)
                    sql_statement = self.generate_sql_insert(transformed_product)
                    sql_statements.append(sql_statement)
                    file_success_count += 1
                    self.stats['successful_transforms'] += 1
                except Exception as e:
                    print(f"❌ Error transforming product from {file_path}: {e}")
                    self.stats['errors'] += 1
                
                self.stats['total_records'] += 1
            
            return sql_statements, file_success_count
            
        except Exception as e:
            print(f"❌ Error processing file {file_path}: {e}")
            self.stats['errors'] += 1
            return [], 0
    
    def process_all_files(self, max_files=None):
        """Process all JSON files and generate SQL import script"""
        print("Starting mass import of 2000+ products with your exact column names...")
        print(f"Processing directory: {self.data_directory}")
        
        # Get all JSON files
        json_files = list(self.data_directory.glob('*.json'))
        json_files.sort()
        
        if max_files:
            json_files = json_files[:max_files]
        
        self.stats['total_files'] = len(json_files)
        print(f"Found {len(json_files)} JSON files to process\n")
        
        # Create output file
        output_file = Path(__file__).parent / 'mass_import.sql'
        
        with open(output_file, 'w', encoding='utf-8') as sql_file:
            # Write header
            sql_file.write("-- ========================================\n")
            sql_file.write("-- MASS IMPORT OF SPS ENTERPRISE PRODUCTS\n")
            sql_file.write("-- Generated from 2000+ scraped JSON files\n")
            sql_file.write(f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            sql_file.write("-- ========================================\n\n")
            sql_file.write("BEGIN;\n\n")
            
            # Process files in batches
            batch_size = 50
            processed_files = 0
            
            for i in range(0, len(json_files), batch_size):
                batch = json_files[i:i + batch_size]
                
                print(f"Processing batch {i//batch_size + 1}/{(len(json_files)-1)//batch_size + 1}...")
                
                batch_statements = []
                batch_success_count = 0
                
                for file_path in batch:
                    sql_statements, file_count = self.process_json_file(file_path)
                    batch_statements.extend(sql_statements)
                    batch_success_count += file_count
                    processed_files += 1
                
                # Write batch to file
                if batch_statements:
                    sql_file.write(f"-- Batch {i//batch_size + 1}: {len(batch_statements)} products\n")
                    for statement in batch_statements:
                        sql_file.write(statement + ";\n\n")
                
                # Progress update
                progress = (processed_files / len(json_files)) * 100
                print(f"Progress: {progress:.1f}% ({processed_files}/{len(json_files)} files)")
                print(f"   Products: {self.stats['successful_transforms']} transformed, {self.stats['errors']} errors\n")
            
            # Write footer
            sql_file.write("COMMIT;\n\n")
            sql_file.write("-- ========================================\n")
            sql_file.write("-- IMPORT STATISTICS\n")
            sql_file.write("-- ========================================\n")
            sql_file.write(f"-- Files processed: {self.stats['total_files']}\n")
            sql_file.write(f"-- Records processed: {self.stats['total_records']}\n")
            sql_file.write(f"-- Successful transforms: {self.stats['successful_transforms']}\n")
            sql_file.write(f"-- Skipped records: {self.stats['skipped_records']}\n")
            sql_file.write(f"-- Errors: {self.stats['errors']}\n")
            
            # Final verification query
            sql_file.write("\n-- Verification queries\n")
            sql_file.write("SELECT COUNT(*) as total_products FROM products_complete;\n")
            sql_file.write("SELECT selling_unit, COUNT(*) as count FROM products_complete GROUP BY selling_unit;\n")
            sql_file.write("SELECT COUNT(*) as products_with_pricing FROM products_complete WHERE selling_price_per_unit IS NOT NULL;\n")
        
        self.stats['end_time'] = datetime.now()
        duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
        
        print("=" * 60)
        print("MASS IMPORT SQL GENERATION COMPLETED!")
        print("=" * 60)
        print(f"Duration: {int(duration//60)}m {int(duration%60)}s")
        print(f"Files processed: {self.stats['total_files']}")
        print(f"Records processed: {self.stats['total_records']}")
        print(f"Successful transforms: {self.stats['successful_transforms']}")
        print(f"Skipped records: {self.stats['skipped_records']}")
        print(f"Errors: {self.stats['errors']}")
        print(f"Success rate: {(self.stats['successful_transforms']/self.stats['total_records']*100):.1f}%")
        print(f"Output file: {output_file}")
        print("=" * 60)
        
        return output_file

def main():
    if len(sys.argv) < 2:
        print("Usage: python batch-import.py <data_directory> [max_files]")
        print("Example: python batch-import.py ../data/scraped/json")
        print("Example: python batch-import.py ../data/scraped/json 100")
        sys.exit(1)
    
    data_directory = sys.argv[1]
    max_files = int(sys.argv[2]) if len(sys.argv) > 2 else None
    
    if not os.path.exists(data_directory):
        print(f"❌ Directory not found: {data_directory}")
        sys.exit(1)
    
    importer = ProductBatchImporter(data_directory)
    output_file = importer.process_all_files(max_files)
    
    print(f"\nNext step: Execute the SQL file in PostgreSQL:")
    print(f"docker-compose exec postgres psql -U crm_user -d crm_db -f /tmp/mass_import.sql")

if __name__ == "__main__":
    main()