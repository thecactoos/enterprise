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

async function setupDatabase() {
  console.log('🚀 Setting up SPS Enterprise CRM Database...\n');
  
  const client = new Client(dbConfig);
  
  try {
    // Connect to database
    console.log('📡 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    // Read and execute init script
    console.log('📜 Reading database schema script...');
    const initScript = fs.readFileSync(
      path.join(__dirname, '../database/init.sql'), 
      'utf8'
    );
    
    console.log('⚡ Executing database initialization...');
    await client.query(initScript);
    console.log('✅ Database schema created successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check sample data
    console.log('\n👥 Checking sample data...');
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    const clientsCount = await client.query('SELECT COUNT(*) FROM clients');
    const notesCount = await client.query('SELECT COUNT(*) FROM notes');
    
    console.log(`   - Users: ${usersCount.rows[0].count}`);
    console.log(`   - Clients: ${clientsCount.rows[0].count}`);
    console.log(`   - Notes: ${notesCount.rows[0].count}`);
    
    // Test views
    console.log('\n📈 Testing database views...');
    const clientStats = await client.query('SELECT * FROM client_stats LIMIT 3');
    console.log(`   - Client stats view: ${clientStats.rows.length} records`);
    
    const userActivity = await client.query('SELECT * FROM user_activity LIMIT 3');
    console.log(`   - User activity view: ${userActivity.rows.length} records`);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your microservices: docker-compose up -d');
    console.log('   2. Check logs: docker-compose logs');
    console.log('   3. Test API endpoints');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure PostgreSQL is running:');
      console.log('   docker-compose up -d postgres');
    }
  } finally {
    await client.end();
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };