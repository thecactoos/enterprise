const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'crm_db',
  user: 'crm_user',
  password: 'crm_password',
};

class ProductImporter {
  constructor() {
    this.client = new Client(dbConfig);
    this.importStats = {
      totalFiles: 0,
      totalRecords: 0,
      successfulImports: 0,
      skippedRecords: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  async connect() {
    console.log('🔌 Connecting to database...');
    await this.client.connect();
    console.log('✅ Connected to PostgreSQL');
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Disconnected from database');
  }

  // Clean Polish decimal format (comma to dot)
  cleanDecimal(value) {
    if (!value || value === '') return null;
    if (typeof value === 'number') return value;
    
    const cleaned = String(value).replace(',', '.').trim();
    const number = parseFloat(cleaned);
    return isNaN(number) ? null : number;
  }

  // Determine product category from name
  determineCategory(productName) {
    if (!productName) return 'other';
    
    const name = productName.toLowerCase();
    
    if (name.includes('vinyl') || 
        name.includes('laminat') || 
        name.includes('podłog') ||
        name.includes('parkiet')) {
      return 'flooring';
    }
    
    if (name.includes('listwa') || 
        name.includes('profil') ||
        name.includes('krawędź')) {
      return 'molding';
    }
    
    if (name.includes('panel') && !name.includes('podłog')) {
      return 'panel';
    }
    
    return 'other';
  }

  // Extract pricing unit from field names
  extractPricingUnit(data) {
    // Look for unit indicators in price field names from original data
    const priceFields = Object.keys(data).filter(key => 
      key.includes('cena_') && key.includes('[zł]')
    );
    
    for (const field of priceFields) {
      if (field.includes('1mb')) return 'mb';
      if (field.includes('1m²') || field.includes('1m2')) return 'm²';
      if (field.includes('1szt')) return 'szt';
    }
    
    // Fallback to jednostka_sprzedażowa
    return data.jednostka_sprzedażowa || 'szt';
  }

  // Convert scraped data to our improved structure
  transformScrapedData(scrapedData) {
    const sellingUnit = scrapedData.jednostka_sprzedażowa || 'szt';
    const pricingUnit = this.extractPricingUnit(scrapedData);
    
    return {
      // Use kod_produktu as external_code, generate UUID as primary key
      external_code: scrapedData.kod_produktu || null,
      
      // Core product information
      product_name: scrapedData.nazwa_produktu || 'Unknown Product',
      unofficial_product_name: scrapedData.nieoficjalna_nazwa_produktu || null,
      category: this.determineCategory(scrapedData.nazwa_produktu),
      
      // Unit management
      measure_unit: sellingUnit === 'mb' ? 'm' : (sellingUnit === 'm²' ? 'm²' : 'piece'),
      base_unit_for_pricing: pricingUnit === 'mb' ? 'm' : (pricingUnit === 'm²' ? 'm²' : 'piece'),
      selling_unit: sellingUnit,
      measurement_units_per_selling_unit: this.cleanDecimal(scrapedData['długość_sprzedażowa_[mb]']) || 1.0,
      
      // Product specifications
      type_of_finish: scrapedData['rodzaj_wykończenia'] || null,
      surface: scrapedData.powierzchnia || null,
      bevel: scrapedData.fazowanie || null,
      
      // Dimensions
      thickness_mm: this.cleanDecimal(scrapedData['grubość_[mm]']),
      width_mm: this.cleanDecimal(scrapedData['szerokość_[mm]']),
      length_mm: this.cleanDecimal(scrapedData['długość_[mm]']),
      package_m2: this.cleanDecimal(scrapedData['paczka_[m²]']),
      
      // Descriptions
      additional_item_description: scrapedData.dodatkowy_opis_przedmiotu || null,
      description: null, // We'll generate this later
      
      // Pricing (all in PLN)
      retail_price_per_unit: this.cleanDecimal(scrapedData['cena_detaliczna_netto_1mb_[zł]'] || scrapedData['cena_detaliczna_netto_1m²_[zł]']),
      selling_price_per_unit: this.cleanDecimal(scrapedData['cena_sprzedaży_netto_1mb_[zł]'] || scrapedData['cena_sprzedaży_netto_1m²_[zł]']),
      purchase_price_per_unit: this.cleanDecimal(scrapedData['cena_zakupu_netto_1mb_[zł]'] || scrapedData['cena_zakupu_netto_1m²_[zł]']),
      potential_profit: this.cleanDecimal(scrapedData['potencjalny_zysk_1mb_[zł]'] || scrapedData['potencjalny_zysk_1m²_[zł]']),
      installation_allowance: 0.0, // Default, can be configured later
      
      // Inventory
      current_stock: 0, // Default
      standard_stock_percent: this.cleanDecimal(scrapedData['standardowy_zapas_[%]']),
      
      // Status
      status: 'active',
      is_active: true,
      
      // Keep original data for reference
      original_scraped_data: scrapedData
    };
  }

  // Insert product into database
  async insertProduct(productData) {
    const query = `
      INSERT INTO products (
        external_code, product_name, unofficial_product_name, category,
        measure_unit, base_unit_for_pricing, selling_unit, measurement_units_per_selling_unit,
        type_of_finish, surface, bevel,
        thickness_mm, width_mm, length_mm, package_m2,
        additional_item_description, description,
        retail_price_per_unit, selling_price_per_unit, purchase_price_per_unit, 
        potential_profit, installation_allowance,
        current_stock, standard_stock_percent,
        status, is_active, original_scraped_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      )
      ON CONFLICT (external_code) 
      DO UPDATE SET
        product_name = EXCLUDED.product_name,
        unofficial_product_name = EXCLUDED.unofficial_product_name,
        category = EXCLUDED.category,
        selling_price_per_unit = EXCLUDED.selling_price_per_unit,
        purchase_price_per_unit = EXCLUDED.purchase_price_per_unit,
        retail_price_per_unit = EXCLUDED.retail_price_per_unit,
        potential_profit = EXCLUDED.potential_profit,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id;
    `;

    const values = [
      productData.external_code,
      productData.product_name,
      productData.unofficial_product_name,
      productData.category,
      productData.measure_unit,
      productData.base_unit_for_pricing,
      productData.selling_unit,
      productData.measurement_units_per_selling_unit,
      productData.type_of_finish,
      productData.surface,
      productData.bevel,
      productData.thickness_mm,
      productData.width_mm,
      productData.length_mm,
      productData.package_m2,
      productData.additional_item_description,
      productData.description,
      productData.retail_price_per_unit,
      productData.selling_price_per_unit,
      productData.purchase_price_per_unit,
      productData.potential_profit,
      productData.installation_allowance,
      productData.current_stock,
      productData.standard_stock_percent,
      productData.status,
      productData.is_active,
      JSON.stringify(productData.original_scraped_data)
    ];

    try {
      const result = await this.client.query(query, values);
      return result.rows[0]?.id;
    } catch (error) {
      console.error(`❌ Error inserting product ${productData.external_code}:`, error.message);
      this.importStats.errors++;
      return null;
    }
  }

  // Process a single JSON file
  async processFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      // Handle different JSON structures
      let products = [];
      
      if (Array.isArray(jsonData)) {
        products = jsonData;
      } else if (jsonData.mergedData && Array.isArray(jsonData.mergedData)) {
        products = jsonData.mergedData;
      } else if (jsonData.mergedData) {
        products = [jsonData.mergedData];
      } else {
        products = [jsonData];
      }

      let fileSuccessCount = 0;
      
      for (const product of products) {
        // Skip if no product code or name
        if (!product.kod_produktu || !product.nazwa_produktu) {
          this.importStats.skippedRecords++;
          continue;
        }

        const transformedProduct = this.transformScrapedData(product);
        const productId = await this.insertProduct(transformedProduct);
        
        if (productId) {
          fileSuccessCount++;
          this.importStats.successfulImports++;
        }
        
        this.importStats.totalRecords++;
      }

      console.log(`✅ ${path.basename(filePath)}: ${fileSuccessCount}/${products.length} products imported`);
      
    } catch (error) {
      console.error(`❌ Error processing file ${filePath}:`, error.message);
      this.importStats.errors++;
    }
  }

  // Get list of JSON files to process
  getJsonFiles(directory) {
    const files = fs.readdirSync(directory);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(directory, file))
      .sort();
  }

  // Main import process
  async importProducts(dataDirectory, maxFiles = null) {
    this.importStats.startTime = new Date();
    console.log('🚀 Starting product import process...\n');

    try {
      await this.connect();

      // Get all JSON files
      const jsonFiles = this.getJsonFiles(dataDirectory);
      console.log(`📁 Found ${jsonFiles.length} JSON files to process`);

      // Limit files if specified
      const filesToProcess = maxFiles ? jsonFiles.slice(0, maxFiles) : jsonFiles;
      this.importStats.totalFiles = filesToProcess.length;

      console.log(`📊 Processing ${filesToProcess.length} files...\n`);

      // Process files in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < filesToProcess.length; i += batchSize) {
        const batch = filesToProcess.slice(i, i + batchSize);
        
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filesToProcess.length/batchSize)}...`);
        
        for (const file of batch) {
          await this.processFile(file);
        }
        
        // Progress update
        const progress = ((i + batch.length) / filesToProcess.length * 100).toFixed(1);
        console.log(`📈 Progress: ${progress}% (${i + batch.length}/${filesToProcess.length} files)\n`);
      }

    } catch (error) {
      console.error('💥 Import process failed:', error.message);
    } finally {
      await this.disconnect();
      this.importStats.endTime = new Date();
      this.printStats();
    }
  }

  // Print import statistics
  printStats() {
    const duration = (this.importStats.endTime - this.importStats.startTime) / 1000;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT STATISTICS');
    console.log('='.repeat(50));
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📁 Files processed: ${this.importStats.totalFiles}`);
    console.log(`📋 Total records: ${this.importStats.totalRecords}`);
    console.log(`✅ Successful imports: ${this.importStats.successfulImports}`);
    console.log(`⏭️  Skipped records: ${this.importStats.skippedRecords}`);
    console.log(`❌ Errors: ${this.importStats.errors}`);
    console.log(`📈 Success rate: ${((this.importStats.successfulImports / this.importStats.totalRecords) * 100).toFixed(1)}%`);
    console.log(`⚡ Records per second: ${(this.importStats.totalRecords / duration).toFixed(1)}`);
    console.log('='.repeat(50));
  }

  // Quick test with sample data
  async testImport() {
    console.log('🧪 Running import test with sample data...\n');
    
    const sampleData = {
      "kod_produktu": "TEST-001",
      "nazwa_produktu": "Test Product Listwa PVC",
      "jednostka_sprzedażowa": "mb",
      "nieoficjalna_nazwa_produktu": "Test Product | 16x60x2400",
      "materiał": "PVC",
      "grubość_[mm]": "16",
      "szerokość_[mm]": "60",
      "długość_[mm]": "2400",
      "cena_zakupu_netto_1mb_[zł]": "14,26",
      "cena_sprzedaży_netto_1mb_[zł]": "23,00",
      "cena_detaliczna_netto_1mb_[zł]": "28,75",
      "potencjalny_zysk_1mb_[zł]": "8,74"
    };

    try {
      await this.connect();
      
      const transformedProduct = this.transformScrapedData(sampleData);
      console.log('🔄 Transformed product:', JSON.stringify(transformedProduct, null, 2));
      
      const productId = await this.insertProduct(transformedProduct);
      
      if (productId) {
        console.log(`✅ Test product inserted with ID: ${productId}`);
        
        // Verify insertion
        const result = await this.client.query('SELECT * FROM products WHERE id = $1', [productId]);
        console.log('📋 Inserted product details:', result.rows[0]);
      } else {
        console.log('❌ Test product insertion failed');
      }
      
    } catch (error) {
      console.error('💥 Test failed:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const importer = new ProductImporter();
  
  switch (command) {
    case 'test':
      await importer.testImport();
      break;
      
    case 'import':
      const dataDir = args[1] || path.join(__dirname, '../data/scraped/json');
      const maxFiles = args[2] ? parseInt(args[2]) : null;
      
      if (!fs.existsSync(dataDir)) {
        console.error(`❌ Data directory not found: ${dataDir}`);
        process.exit(1);
      }
      
      await importer.importProducts(dataDir, maxFiles);
      break;
      
    default:
      console.log('📖 Usage:');
      console.log('  npm run import-products test                    # Test with sample data');
      console.log('  npm run import-products import [dir] [limit]    # Import all products');
      console.log('');
      console.log('Examples:');
      console.log('  npm run import-products import                  # Import all files');
      console.log('  npm run import-products import ../data/scraped/json 100  # Import first 100 files');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProductImporter };