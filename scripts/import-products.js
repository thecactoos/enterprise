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
      duplicates: 0,
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

  // Extract pricing unit from field names
  extractPricingUnit(data) {
    const priceFields = Object.keys(data).filter(key => 
      key.includes('cena_') && key.includes('[zł]')
    );
    
    for (const field of priceFields) {
      if (field.includes('1mb')) return 'mb';
      if (field.includes('1m²') || field.includes('1m2')) return 'm²';
      if (field.includes('1szt')) return 'szt';
    }
    
    return data.jednostka_sprzedażowa || 'szt';
  }

  // Convert scraped data to your exact column names
  transformToExactColumns(scrapedData) {
    const sellingUnit = scrapedData.jednostka_sprzedażowa || 'szt';
    const pricingUnit = this.extractPricingUnit(scrapedData);
    
    return {
      // YOUR EXACT COLUMN NAMES
      product_code: scrapedData.kod_produktu || null,
      product_name: scrapedData.nazwa_produktu || 'Unknown Product',
      measure_unit: sellingUnit,
      base_unit_for_pricing: pricingUnit,
      selling_unit: sellingUnit,
      measurement_units_per_selling_unit: this.cleanDecimal(scrapedData['długość_sprzedażowa_[mb]']) || 1.0,
      unofficial_product_name: scrapedData.nieoficjalna_nazwa_produktu || null,
      type_of_finish: scrapedData['rodzaj_wykończenia'] || null,
      surface: scrapedData.powierzchnia || null,
      bevel: scrapedData.fazowanie || null,
      thickness_mm: this.cleanDecimal(scrapedData['grubość_[mm]']),
      width_mm: this.cleanDecimal(scrapedData['szerokość_[mm]']),
      length_mm: this.cleanDecimal(scrapedData['długość_[mm]']),
      package_m2: this.cleanDecimal(scrapedData['paczka_[m²]']),
      additional_item_description: scrapedData.dodatkowy_opis_przedmiotu || null,
      retail_price_per_unit: this.cleanDecimal(
        scrapedData['cena_detaliczna_netto_1mb_[zł]'] || 
        scrapedData['cena_detaliczna_netto_1m²_[zł]']
      ),
      selling_price_per_unit: this.cleanDecimal(
        scrapedData['cena_sprzedaży_netto_1mb_[zł]'] || 
        scrapedData['cena_sprzedaży_netto_1m²_[zł]']
      ),
      purchase_price_per_unit: this.cleanDecimal(
        scrapedData['cena_zakupu_netto_1mb_[zł]'] || 
        scrapedData['cena_zakupu_netto_1m²_[zł]']
      ),
      potential_profit: this.cleanDecimal(
        scrapedData['potencjalny_zysk_1mb_[zł]'] || 
        scrapedData['potencjalny_zysk_1m²_[zł]']
      ),
      installation_allowance: 0.0, // Default
      currency: 'PLN',
      status: 'active',
      is_active: true,
      original_scraped_data: scrapedData
    };
  }

  // Insert product using your exact column names
  async insertProduct(productData) {
    const query = `
      INSERT INTO products (
        product_code, product_name, measure_unit, base_unit_for_pricing, selling_unit,
        measurement_units_per_selling_unit, unofficial_product_name, type_of_finish,
        surface, bevel, thickness_mm, width_mm, length_mm, package_m2,
        additional_item_description, retail_price_per_unit, selling_price_per_unit,
        purchase_price_per_unit, potential_profit, installation_allowance,
        currency, status, is_active, original_scraped_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
      RETURNING id;
    `;

    const values = [
      productData.product_code,
      productData.product_name,
      productData.measure_unit,
      productData.base_unit_for_pricing,
      productData.selling_unit,
      productData.measurement_units_per_selling_unit,
      productData.unofficial_product_name,
      productData.type_of_finish,
      productData.surface,
      productData.bevel,
      productData.thickness_mm,
      productData.width_mm,
      productData.length_mm,
      productData.package_m2,
      productData.additional_item_description,
      productData.retail_price_per_unit,
      productData.selling_price_per_unit,
      productData.purchase_price_per_unit,
      productData.potential_profit,
      productData.installation_allowance,
      productData.currency,
      productData.status,
      productData.is_active,
      JSON.stringify(productData.original_scraped_data)
    ];

    try {
      const result = await this.client.query(query, values);
      return result.rows[0]?.id;
    } catch (error) {
      if (error.code === '23505') { // Duplicate key
        this.importStats.duplicates++;
        return 'duplicate';
      }
      console.error(`❌ Error inserting product ${productData.product_code}:`, error.message);
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

        const transformedProduct = this.transformToExactColumns(product);
        const productId = await this.insertProduct(transformedProduct);
        
        if (productId && productId !== 'duplicate') {
          fileSuccessCount++;
          this.importStats.successfulImports++;
        }
        
        this.importStats.totalRecords++;
      }

      const fileName = path.basename(filePath);
      if (fileSuccessCount > 0) {
        console.log(`✅ ${fileName}: ${fileSuccessCount}/${products.length} products imported`);
      } else if (this.importStats.totalRecords % 100 === 0) {
        console.log(`📊 Progress: ${this.importStats.totalRecords} records processed...`);
      }
      
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
    console.log('🚀 Starting product import with your exact column names...\n');

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
      const batchSize = 20;
      let processedFiles = 0;
      
      for (let i = 0; i < filesToProcess.length; i += batchSize) {
        const batch = filesToProcess.slice(i, i + batchSize);
        
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filesToProcess.length/batchSize)}...`);
        
        // Process batch files
        for (const file of batch) {
          await this.processFile(file);
          processedFiles++;
        }
        
        // Progress update every batch
        const progress = (processedFiles / filesToProcess.length * 100).toFixed(1);
        console.log(`📈 Progress: ${progress}% (${processedFiles}/${filesToProcess.length} files)`);
        console.log(`   Records: ${this.importStats.successfulImports} imported, ${this.importStats.duplicates} duplicates, ${this.importStats.errors} errors\n`);
      }

      // Final statistics from database
      await this.printDatabaseStats();

    } catch (error) {
      console.error('💥 Import process failed:', error.message);
    } finally {
      await this.disconnect();
      this.importStats.endTime = new Date();
      this.printFinalStats();
    }
  }

  // Print database statistics
  async printDatabaseStats() {
    try {
      console.log('\n📊 CHECKING DATABASE STATISTICS...');
      
      const totalCount = await this.client.query('SELECT COUNT(*) as count FROM products');
      console.log(`📋 Total products in database: ${totalCount.rows[0].count}`);
      
      const unitStats = await this.client.query(`
        SELECT selling_unit, COUNT(*) as count 
        FROM products 
        GROUP BY selling_unit 
        ORDER BY count DESC
      `);
      console.log('📏 Products by selling unit:');
      unitStats.rows.forEach(row => {
        console.log(`   ${row.selling_unit}: ${row.count} products`);
      });
      
      const priceStats = await this.client.query(`
        SELECT 
          COUNT(CASE WHEN selling_price_per_unit > 0 THEN 1 END) as with_price,
          ROUND(AVG(selling_price_per_unit), 2) as avg_price,
          ROUND(MIN(selling_price_per_unit), 2) as min_price,
          ROUND(MAX(selling_price_per_unit), 2) as max_price
        FROM products 
        WHERE selling_price_per_unit > 0
      `);
      if (priceStats.rows[0].with_price > 0) {
        const stats = priceStats.rows[0];
        console.log(`💰 Pricing: ${stats.with_price} products with prices`);
        console.log(`   Average: ${stats.avg_price} PLN, Range: ${stats.min_price}-${stats.max_price} PLN`);
      }
      
    } catch (error) {
      console.log('⚠️  Could not retrieve database statistics:', error.message);
    }
  }

  // Print final import statistics
  printFinalStats() {
    const duration = (this.importStats.endTime - this.importStats.startTime) / 1000;
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPLETE IMPORT FINISHED!');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${Math.floor(duration / 60)}m ${(duration % 60).toFixed(0)}s`);
    console.log(`📁 Files processed: ${this.importStats.totalFiles}`);
    console.log(`📋 Total records processed: ${this.importStats.totalRecords}`);
    console.log(`✅ Successful imports: ${this.importStats.successfulImports}`);
    console.log(`🔄 Duplicates handled: ${this.importStats.duplicates}`);
    console.log(`⏭️  Skipped records: ${this.importStats.skippedRecords}`);
    console.log(`❌ Errors: ${this.importStats.errors}`);
    console.log(`📈 Success rate: ${((this.importStats.successfulImports / this.importStats.totalRecords) * 100).toFixed(1)}%`);
    console.log(`⚡ Records per second: ${(this.importStats.totalRecords / duration).toFixed(1)}`);
    console.log('\n🎯 Database now contains your complete product catalog!');
    console.log('='.repeat(60));
  }

  // Quick test with sample data
  async testImport() {
    console.log('🧪 Testing product import with your exact column names...\n');
    
    const sampleData = {
      "kod_produktu": "TEST-MB-001", 
      "nazwa_produktu": "[S] Tarkett Listwa Foliowana Biała",
      "jednostka_sprzedażowa": "mb",
      "nieoficjalna_nazwa_produktu": "Tarkett Listwa Foliowana Biała | 16x60x2400",
      "rodzaj_wykończenia": "PVC",
      "powierzchnia": "foliowana",
      "fazowanie": null,
      "grubość_[mm]": "16",
      "szerokość_[mm]": "60", 
      "długość_[mm]": "2400",
      "długość_sprzedażowa_[mb]": "2,5",
      "dodatkowy_opis_przedmiotu": "Listwa wykończeniowa PVC",
      "cena_zakupu_netto_1mb_[zł]": "14,26",
      "cena_sprzedaży_netto_1mb_[zł]": "23,00", 
      "cena_detaliczna_netto_1mb_[zł]": "28,75",
      "potencjalny_zysk_1mb_[zł]": "8,74"
    };

    try {
      await this.connect();
      
      const transformedProduct = this.transformToExactColumns(sampleData);
      console.log('🔄 Transformed with your exact columns:');
      console.log(JSON.stringify(transformedProduct, null, 2));
      
      const productId = await this.insertProduct(transformedProduct);
      
      if (productId && productId !== 'duplicate') {
        console.log(`✅ Test product inserted with UUID: ${productId}`);
        
        // Verify with your exact column names
        const result = await this.client.query(`
          SELECT 
            product_code, product_name, selling_unit, thickness_mm, width_mm, length_mm,
            selling_price_per_unit, purchase_price_per_unit, potential_profit
          FROM products 
          WHERE id = $1
        `, [productId]);
        
        console.log('\n📋 Inserted product with your exact columns:');
        console.log(result.rows[0]);
      } else {
        console.log('❌ Test product insertion failed or duplicate');
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
      console.log('📖 Product Import - Your Exact Column Names');
      console.log('Usage:');
      console.log('  npm run import-products test                    # Test with sample');
      console.log('  npm run import-products import [dir] [limit]    # Import all products');
      console.log('');
      console.log('Examples:');
      console.log('  npm run import-products import                  # Import ALL 2000+ files');
      console.log('  npm run import-products import ../data/scraped/json 100  # Import first 100 files');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProductImporter };