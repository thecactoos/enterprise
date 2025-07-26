const { Client } = require('pg');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'crm_db',
  user: 'crm_user',
  password: 'crm_password',
};

async function checkProductsCount() {
  console.log('🔍 Checking products in database...\n');
  
  const client = new Client(dbConfig);
  
  try {
    console.log('📡 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connection successful!\n');
    
    // Check which product tables exist
    console.log('🔍 Checking for product tables...');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%product%'
      ORDER BY table_name;
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ No product tables found in database');
      return;
    }
    
    console.log('📋 Found product tables:');
    tableCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check each table for record counts
    console.log('\n📊 Product counts by table:');
    
    for (const table of tableCheck.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`   - ${table.table_name}: ${count.toLocaleString()} records`);
        
        // Get sample data if records exist
        if (count > 0) {
          const sampleResult = await client.query(`
            SELECT * FROM ${table.table_name} 
            ORDER BY created_at DESC 
            LIMIT 3
          `);
          
          console.log(`   Sample from ${table.table_name}:`);
          sampleResult.rows.forEach((row, index) => {
            const productName = row.product_name || row.name || 'Unknown Product';
            const productCode = row.product_code || row.external_code || row.sku || 'No Code';
            console.log(`     ${index + 1}. ${productName} (${productCode})`);
          });
          console.log('');
        }
      } catch (tableError) {
        console.log(`   - ${table.table_name}: ❌ Error reading table - ${tableError.message}`);
      }
    }
    
    // Check total across all product tables
    let totalProducts = 0;
    for (const table of tableCheck.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        totalProducts += parseInt(countResult.rows[0].count);
      } catch (error) {
        // Skip tables with errors
      }
    }
    
    console.log(`🎯 Total products across all tables: ${totalProducts.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database connection refused. Start the database with:');
      console.log('   docker-compose up -d postgres');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Run the full setup:');
      console.log('   docker-compose up -d');
    }
  } finally {
    await client.end();
  }
}

// Run the check
checkProductsCount().catch(console.error);