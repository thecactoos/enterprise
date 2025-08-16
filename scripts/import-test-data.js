const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration matching development environment
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'enterprise_crm',
  user: 'postgres',
  password: 'devpassword123',
};

async function importTestData() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Read test data
    const testDataPath = path.join(__dirname, 'test_data.json');
    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    
    console.log(`📋 Found ${testData.length} test products to import`);

    // Transform and insert each product
    for (let i = 0; i < testData.length; i++) {
      const product = testData[i];
      
      console.log(`\n📦 Processing product ${i + 1}: ${product.nazwa_produktu}`);
      console.log(`   Code: ${product.kod_produktu}`);
      console.log(`   Unit: ${product.jednostka_sprzedażowa}`);
      
      // Extract pricing unit from field names
      let pricingUnit = product.jednostka_sprzedażowa;
      const priceFields = Object.keys(product).filter(key => 
        key.includes('cena_') && key.includes('[zł]')
      );
      
      for (const field of priceFields) {
        if (field.includes('1mb')) { pricingUnit = 'mb'; break; }
        if (field.includes('1m²') || field.includes('1m2')) { pricingUnit = 'm²'; break; }
        if (field.includes('1szt')) { pricingUnit = 'szt'; break; }
      }
      
      console.log(`   Pricing unit: ${pricingUnit}`);
      
      // Clean decimal function
      const cleanDecimal = (value) => {
        if (!value || value === '') return null;
        if (typeof value === 'number') return value;
        const cleaned = String(value).replace(',', '.').trim();
        const number = parseFloat(cleaned);
        return isNaN(number) ? null : number;
      };

      // Map to valid constraint values for both measure_unit and base_unit_for_pricing
      let validMeasureUnit = pricingUnit;
      let validPricingUnit = pricingUnit;
      
      if (pricingUnit === 'szt') {
        validMeasureUnit = 'piece';
        validPricingUnit = 'piece';
      }
      
      console.log(`   Valid measure unit: ${validMeasureUnit}`);

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
        product.kod_produktu,
        product.nazwa_produktu,
        validMeasureUnit,  // Use mapped valid measure unit
        validPricingUnit,  // Use mapped valid pricing unit
        product.jednostka_sprzedażowa,
        cleanDecimal(product['długość_sprzedażowa_[mb]']) || 1.0,
        product.nieoficjalna_nazwa_produktu,
        product['rodzaj_wykończenia'],
        product.powierzchnia,
        product.fazowanie,
        cleanDecimal(product['grubość_[mm]']),
        cleanDecimal(product['szerokość_[mm]']),
        cleanDecimal(product['długość_[mm]']),
        cleanDecimal(product['paczka_[m²]']),
        product.dodatkowy_opis_przedmiotu,
        cleanDecimal(
          product['cena_detaliczna_netto_1mb_[zł]'] || 
          product['cena_detaliczna_netto_1m²_[zł]'] ||
          product['cena_detaliczna_netto_1szt_[zł]']
        ),
        cleanDecimal(
          product['cena_sprzedaży_netto_1mb_[zł]'] || 
          product['cena_sprzedaży_netto_1m²_[zł]'] ||
          product['cena_sprzedaży_netto_1szt_[zł]']
        ),
        cleanDecimal(
          product['cena_zakupu_netto_1mb_[zł]'] || 
          product['cena_zakupu_netto_1m²_[zł]'] ||
          product['cena_zakupu_netto_1szt_[zł]']
        ),
        cleanDecimal(
          product['potencjalny_zysk_1mb_[zł]'] || 
          product['potencjalny_zysk_1m²_[zł]'] ||
          product['potencjalny_zysk_1szt_[zł]']
        ),
        0.0,
        'PLN',
        'active',
        true,
        JSON.stringify(product)
      ];

      try {
        const result = await client.query(query, values);
        console.log(`✅ Inserted product with ID: ${result.rows[0].id}`);
      } catch (error) {
        console.error(`❌ Error inserting product ${product.kod_produktu}:`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Detail: ${error.detail || 'No additional details'}`);
        
        if (error.constraint) {
          console.error(`   Constraint: ${error.constraint}`);
        }
      }
    }

    // Check results
    const countResult = await client.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n📊 Total products in database: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('💥 Import failed:', error.message);
  } finally {
    await client.end();
  }
}

importTestData().catch(console.error);