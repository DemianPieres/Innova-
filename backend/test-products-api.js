require('dotenv').config();

// Script simple para probar la API de productos
const API_BASE_URL = 'http://localhost:4000';

async function testProductsAPI() {
  console.log('🧪 Testing Products API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('   ✅ Health check:', healthData.message);
    console.log('   📊 Database:', healthData.database);

    // Test 2: Get all products
    console.log('\n2️⃣ Testing get all products...');
    const productsResponse = await fetch(`${API_BASE_URL}/api/products?page=1&limit=5`);
    const productsData = await productsResponse.json();
    
    if (productsData.success) {
      console.log(`   ✅ Found ${productsData.data.length} products`);
      console.log(`   📊 Total in database: ${productsData.pagination.totalItems}`);
      
      if (productsData.data.length > 0) {
        console.log('\n   📦 First product:');
        const firstProduct = productsData.data[0];
        console.log(`      - Name: ${firstProduct.name}`);
        console.log(`      - Price: $${firstProduct.price}`);
        console.log(`      - Category: ${firstProduct.category}`);
        console.log(`      - Stock: ${firstProduct.stock}`);
      }
    } else {
      console.log('   ❌ Error getting products');
    }

    // Test 3: Filter by category
    console.log('\n3️⃣ Testing filter by category...');
    const filteredResponse = await fetch(`${API_BASE_URL}/api/products?category=volantes`);
    const filteredData = await filteredResponse.json();
    
    if (filteredData.success) {
      console.log(`   ✅ Found ${filteredData.data.length} products in "volantes" category`);
    }

    // Test 4: Search products
    console.log('\n4️⃣ Testing search...');
    const searchResponse = await fetch(`${API_BASE_URL}/api/products?search=volante`);
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log(`   ✅ Found ${searchData.data.length} products matching "volante"`);
    }

    // Test 5: Get product stats
    console.log('\n5️⃣ Testing product stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/products/stats`);
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      console.log('   ✅ Product statistics:');
      console.log(`      - Total products: ${statsData.data.total}`);
      console.log(`      - Active products: ${statsData.data.active}`);
      console.log(`      - Inactive products: ${statsData.data.inactive}`);
      console.log(`      - Out of stock: ${statsData.data.outOfStock}`);
      
      console.log('\n      By category:');
      statsData.data.byCategory.forEach(cat => {
        console.log(`         - ${cat._id}: ${cat.count} products`);
      });
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Error running tests:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. The backend server is running (npm start)');
    console.error('   2. MongoDB is connected');
    console.error('   3. Products have been inserted (node insert-sample-products.js)');
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18 or higher (for native fetch support)');
  console.error('💡 Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

testProductsAPI();


