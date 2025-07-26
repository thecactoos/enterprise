# 🗄️ SPS Enterprise CRM Database

## 📋 Overview

This directory contains the database schema and setup scripts for the SPS Enterprise CRM system. The database uses **PostgreSQL 15** with proper foreign key relationships, indexes for performance, and sample data for development.

## 🏗️ Database Schema

### **Tables:**

#### 1. **users** 👥
```sql
- id (UUID, PK)
- name (VARCHAR) 
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- role (ENUM: 'admin', 'user')
- isActive (BOOLEAN)
- createdAt, updatedAt (TIMESTAMP)
```

#### 2. **clients** 🏢  
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE) 
- phone (VARCHAR)
- company (VARCHAR)
- address (TEXT)
- notes (TEXT)
- isActive (BOOLEAN)
- createdAt, updatedAt (TIMESTAMP)
```

#### 3. **notes** 📝
```sql
- id (UUID, PK)
- title (VARCHAR)
- content (TEXT)
- clientId (UUID, FK → clients.id)
- userId (UUID, FK → users.id) 
- isImportant (BOOLEAN)
- createdAt, updatedAt (TIMESTAMP)
```

### **Relationships:**
- **notes.clientId** → **clients.id** (CASCADE DELETE)
- **notes.userId** → **users.id** (SET NULL)

### **Performance Indexes:**
- Email lookups (users, clients)
- Foreign key relationships (notes)
- Common filters (role, company, isActive, isImportant)
- Date-based queries (createdAt)

### **Database Views:**
- **client_stats** - Client activity summary
- **user_activity** - User engagement metrics

## 🚀 Quick Setup

### **1. Start Database Container**
```bash
docker-compose up -d postgres
```

### **2. Run Database Setup**
```bash
cd scripts
npm install
npm run setup-db
```

### **3. Test Connection**
```bash
npm run test-connection
```

## 🔧 Manual Setup Steps

### **Step 1: Prerequisites**
```bash
# Make sure PostgreSQL container is running
docker-compose ps postgres

# If not running, start it
docker-compose up -d postgres
```

### **Step 2: Install Script Dependencies**
```bash
cd scripts
npm install
```

### **Step 3: Initialize Database**
```bash
# Option A: Using Node.js script (recommended)
node setup-database.js

# Option B: Direct SQL execution
docker-compose exec postgres psql -U crm_user -d crm_db -f /docker-entrypoint-initdb.d/init.sql
```

### **Step 4: Verify Setup**
```bash
# Test connection and check tables
node test-connection.js

# Or connect directly
docker-compose exec postgres psql -U crm_user -d crm_db
```

## 📊 Sample Data

The database includes sample data for development:

### **Users:**
- **john@example.com** (Admin) - password: `password123`
- **jane@example.com** (User) - password: `password123`  
- **bob@example.com** (User) - password: `password123`

### **Clients:**
- Acme Corporation, Tech Solutions Ltd, Global Industries, StartupXYZ, Enterprise Corp

### **Notes:**
- 5 sample notes linked to clients and users
- Mix of important and regular notes

## 🛠️ Development Commands

### **Connect to Database**
```bash
# Via Docker
docker-compose exec postgres psql -U crm_user -d crm_db

# Via local psql (if installed)
psql -h localhost -p 5432 -U crm_user -d crm_db
```

### **Useful Queries**
```sql
-- Check all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Client activity summary
SELECT * FROM client_stats;

-- User activity summary  
SELECT * FROM user_activity;

-- Recent notes
SELECT n.title, c.name as client, u.name as user 
FROM notes n
JOIN clients c ON n."clientId" = c.id
LEFT JOIN users u ON n."userId" = u.id
ORDER BY n."createdAt" DESC
LIMIT 10;
```

### **Reset Database**
```bash
# Stop and remove containers
docker-compose down

# Remove volume (WARNING: This deletes all data!)
docker volume rm sps-enterprise_postgres_data

# Start fresh
docker-compose up -d postgres
cd scripts && npm run setup-db
```

## 🔍 Troubleshooting

### **Connection Issues**
```bash
# Check if container is running
docker-compose ps postgres

# Check container logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### **Permission Issues**
```bash
# Verify user permissions
docker-compose exec postgres psql -U crm_user -d crm_db -c "\\du"

# Check table permissions
docker-compose exec postgres psql -U crm_user -d crm_db -c "\\dp"
```

### **Schema Issues**
```bash
# Check if tables exist
docker-compose exec postgres psql -U crm_user -d crm_db -c "\\dt"

# Recreate schema
docker-compose exec postgres psql -U crm_user -d crm_db -f /docker-entrypoint-initdb.d/init.sql
```

## 🚨 Production Considerations

### **Security:**
- [ ] Change default passwords
- [ ] Use environment variables for credentials
- [ ] Enable SSL connections
- [ ] Set up proper user roles and permissions
- [ ] Regular security updates

### **Performance:**
- [ ] Monitor query performance
- [ ] Add additional indexes based on usage patterns
- [ ] Set up connection pooling
- [ ] Configure appropriate PostgreSQL settings
- [ ] Regular VACUUM and ANALYZE

### **Backup:**
- [ ] Set up automated backups
- [ ] Test restore procedures
- [ ] Monitor backup integrity
- [ ] Off-site backup storage

### **Monitoring:**
- [ ] Database performance metrics
- [ ] Connection monitoring
- [ ] Disk space alerts
- [ ] Slow query logging

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)
- [NestJS Database Documentation](https://docs.nestjs.com/techniques/database)

## 🤝 Contributing

When modifying the database schema:

1. Update `init.sql` with new tables/columns
2. Update corresponding TypeORM entities
3. Add new indexes for performance
4. Update this README
5. Test changes with sample data
6. Update API documentation if needed

---

**Need help?** Check the troubleshooting section or contact the development team.