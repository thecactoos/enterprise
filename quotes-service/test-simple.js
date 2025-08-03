#!/usr/bin/env node

/**
 * Simple test script for quotes-service endpoint without database dependency
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate test JWT token
const testPayload = {
  user_id: 'test-user-123',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
};

const JWT_SECRET = 'your-secret-key'; // Same as in auth guard
const testToken = jwt.sign(testPayload, JWT_SECRET);

console.log('Generated JWT Token:', testToken);
console.log('Payload:', jwt.decode(testToken));

// Test data
const testQuote = {
  area: 25.5,
  product_id: '123e4567-e89b-12d3-a456-426614174000', // Mock product in pricing service
  client_id: '123e4567-e89b-12d3-a456-426614174001',
  with_installation: true
};

const testQuoteNoInstallation = {
  area: 15.0,
  product_id: '123e4567-e89b-12d3-a456-426614174000',
  client_id: '123e4567-e89b-12d3-a456-426614174001', 
  with_installation: false
};

console.log('\\nTest 1: POST /quotes with installation');
console.log('Headers: Authorization: Bearer <token>');
console.log('Body:', JSON.stringify(testQuote, null, 2));

console.log('\\nTest 2: POST /quotes without installation');
console.log('Headers: Authorization: Bearer <token>');
console.log('Body:', JSON.stringify(testQuoteNoInstallation, null, 2));

console.log('\\nTest 3: POST /quotes without token (should return 401)');
console.log('Body:', JSON.stringify(testQuote, null, 2));

console.log('\\nTest 4: POST /quotes with invalid product_id (should return 404)');
console.log('Headers: Authorization: Bearer <token>');
console.log('Body:', JSON.stringify({
  ...testQuote,
  product_id: 'invalid-product-id'
}, null, 2));

console.log('\\n=== Manual curl commands ===\\n');

const baseUrl = 'http://localhost:3006/api/v1';

console.log('# Test 1: With installation');
console.log(`curl -X POST ${baseUrl}/quotes \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer ${testToken}" \\`);
console.log(`  -d '${JSON.stringify(testQuote)}'`);

console.log('\\n# Test 2: Without installation');
console.log(`curl -X POST ${baseUrl}/quotes \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer ${testToken}" \\`);
console.log(`  -d '${JSON.stringify(testQuoteNoInstallation)}'`);

console.log('\\n# Test 3: No token (401)');
console.log(`curl -X POST ${baseUrl}/quotes \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '${JSON.stringify(testQuote)}'`);

console.log('\\n# Test 4: Invalid product (404)');
console.log(`curl -X POST ${baseUrl}/quotes \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer ${testToken}" \\`);
console.log(`  -d '${JSON.stringify({...testQuote, product_id: 'invalid-product-id'})}'`);

console.log('\\n# Health check');
console.log(`curl ${baseUrl}/quotes/health`);