// Test video streaming functionality
const API_BASE_URL = 'http://localhost:8081';

async function testVideoStreaming() {
  console.log('Testing video streaming...\n');
  
  try {
    // Test webinar info to get video URL
    console.log('1. Testing webinar info endpoint...');
    const webinarResponse = await fetch(`${API_BASE_URL}/api/webinar`);
    if (webinarResponse.ok) {
      const webinarData = await webinarResponse.json();
      console.log('✅ Webinar info endpoint working');
      console.log('   Video URL:', webinarData.video_url);
      
      // Test video streaming endpoint
      const videoUrl = `${API_BASE_URL}${webinarData.video_url}`;
      console.log('\n2. Testing video streaming endpoint...');
      console.log('   URL:', videoUrl);
      
      const videoResponse = await fetch(videoUrl, {
        method: 'HEAD' // Just check headers, don't download the whole video
      });
      
      if (videoResponse.ok) {
        console.log('✅ Video streaming endpoint working');
        console.log('   Content-Type:', videoResponse.headers.get('content-type'));
        console.log('   Accept-Ranges:', videoResponse.headers.get('accept-ranges'));
        console.log('   Content-Length:', videoResponse.headers.get('content-length'));
      } else {
        console.log('❌ Video streaming endpoint failed:', videoResponse.status);
      }
      
      // Test range request (partial content)
      console.log('\n3. Testing range request...');
      const rangeResponse = await fetch(videoUrl, {
        headers: {
          'Range': 'bytes=0-1023' // Request first 1KB
        }
      });
      
      if (rangeResponse.status === 206) {
        console.log('✅ Range requests working');
        console.log('   Content-Range:', rangeResponse.headers.get('content-range'));
        console.log('   Content-Length:', rangeResponse.headers.get('content-length'));
      } else {
        console.log('⚠️  Range requests not supported:', rangeResponse.status);
      }
      
    } else {
      console.log('❌ Webinar info endpoint failed:', webinarResponse.status);
    }
    
    console.log('\n🎉 Video streaming test completed!');
    
  } catch (error) {
    console.error('❌ Video streaming test failed:', error.message);
    console.log('\nMake sure your backend server is running on localhost:8081');
    console.log('And you have video files in the backend/videos/ directory');
  }
}

testVideoStreaming(); 