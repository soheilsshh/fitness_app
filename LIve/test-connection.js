// Simple script to test backend connection
const API_BASE_URL = 'http://localhost:8081/api';

async function testConnection() {
  console.log('Testing backend connection...\n');
  
  try {
    // Test webinar info endpoint
    console.log('1. Testing webinar info endpoint...');
    const webinarResponse = await fetch(`${API_BASE_URL}/webinar`);
    if (webinarResponse.ok) {
      const webinarData = await webinarResponse.json();
      console.log('✅ Webinar info endpoint working');
      console.log('   Title:', webinarData.title);
      console.log('   Capacity:', webinarData.capacity);
      console.log('   Registered:', webinarData.registered_count);
    } else {
      console.log('❌ Webinar info endpoint failed:', webinarResponse.status);
    }
    
    // Test chat messages endpoint
    console.log('\n2. Testing chat messages endpoint...');
    const chatResponse = await fetch(`${API_BASE_URL}/chat`);
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat messages endpoint working');
      console.log('   Messages count:', chatData.messages?.length || 0);
    } else {
      console.log('❌ Chat messages endpoint failed:', chatResponse.status);
    }
    
    // Test registration endpoint
    console.log('\n3. Testing registration endpoint...');
    const registerResponse = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'User',
        phone: '09123456789'
      })
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration endpoint working');
      console.log('   Message:', registerData.message);
    } else {
      const errorData = await registerResponse.json();
      console.log('⚠️  Registration endpoint response:', errorData.error);
      console.log('   (This might be expected if phone already exists)');
    }
    
    console.log('\n🎉 Backend connection test completed!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nMake sure your backend server is running on localhost:8081');
  }
}

testConnection(); 