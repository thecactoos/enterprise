const { Client } = require('pg');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'crm_db',
  user: 'crm_user',
  password: 'crm_password',
};

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  const client = new Client(dbConfig);
  
  try {
    // Test connection
    console.log('📡 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connection successful!\n');
    
    // Test basic query
    console.log('⚡ Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('📊 Database info:');
    console.log(`   - Current time: ${result.rows[0].current_time}`);
    console.log(`   - Version: ${result.rows[0].db_version.split(' ')[0]}`);
    
    // Check if tables exist
    console.log('\n🔍 Checking database schema...');
    const tables = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    if (tables.rows.length > 0) {
      console.log('📋 Available tables:');
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name} (${row.column_count} columns)`);
      });
    } else {
      console.log('⚠️  No tables found. Run setup-database.js first.');
    }
    
    // Test sample data if tables exist
    if (tables.rows.some(row => row.table_name === 'users')) {
      console.log('\n👤 Sample data check:');
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      const clientCount = await client.query('SELECT COUNT(*) as count FROM clients');
      const noteCount = await client.query('SELECT COUNT(*) as count FROM notes');
      
      console.log(`   - Users: ${userCount.rows[0].count}`);
      console.log(`   - Clients: ${clientCount.rows[0].count}`);
      console.log(`   - Notes: ${noteCount.rows[0].count}`);
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Make sure PostgreSQL container is running:');
      console.log('      docker-compose up -d postgres');
      console.log('   2. Check container status:');
      console.log('      docker-compose ps postgres');
      console.log('   3. Check container logs:');
      console.log('      docker-compose logs postgres');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Make sure Docker setup is complete.');
    }
  } finally {
    await client.end();
  }
}

// Run the test
if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };