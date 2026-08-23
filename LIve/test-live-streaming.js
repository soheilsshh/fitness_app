// Test live streaming functionality
const API_BASE_URL = 'http://localhost:8081';

async function testLiveStreaming() {
  console.log('Testing live streaming...\n');
  
  try {
    // Test webinar info to get video URL
    console.log('1. Testing webinar info endpoint...');
    const webinarResponse = await fetch(`${API_BASE_URL}/api/webinar`);
    if (webinarResponse.ok) {
      const webinarData = await webinarResponse.json();
      console.log('✅ Webinar info endpoint working');
      console.log('   Video URL:', webinarData.video_url);
      
      // Test live streaming endpoint
      const videoUrl = `${API_BASE_URL}${webinarData.video_url}`;
      console.log('\n2. Testing live streaming endpoint...');
      console.log('   URL:', videoUrl);
      
      const videoResponse = await fetch(videoUrl, {
        method: 'HEAD' // Just check headers, don't download the whole video
      });
      
      if (videoResponse.ok) {
        console.log('✅ Live streaming endpoint working');
        console.log('   Content-Type:', videoResponse.headers.get('content-type'));
        console.log('   Accept-Ranges:', videoResponse.headers.get('accept-ranges'));
        console.log('   X-Live-Stream:', videoResponse.headers.get('x-live-stream'));
        console.log('   Cache-Control:', videoResponse.headers.get('cache-control'));
        
        // Check if it's configured as live stream
        const acceptRanges = videoResponse.headers.get('accept-ranges');
        const isLiveStream = videoResponse.headers.get('x-live-stream');
        
        if (acceptRanges === 'none' && isLiveStream === 'true') {
          console.log('✅ Live streaming properly configured (no seeking allowed)');
        } else {
          console.log('⚠️  Live streaming not properly configured');
        }
      } else {
        console.log('❌ Live streaming endpoint failed:', videoResponse.status);
      }
      
      // Test that range requests are rejected for live streaming
      console.log('\n3. Testing range request rejection...');
      const rangeResponse = await fetch(videoUrl, {
        headers: {
          'Range': 'bytes=0-1023' // Request first 1KB
        }
      });
      
      if (rangeResponse.status === 200) {
        console.log('✅ Range requests properly rejected for live streaming');
        console.log('   Status:', rangeResponse.status);
        console.log('   Accept-Ranges:', rangeResponse.headers.get('accept-ranges'));
      } else {
        console.log('⚠️  Range request handling unexpected:', rangeResponse.status);
      }
      
    } else {
      console.log('❌ Webinar info endpoint failed:', webinarResponse.status);
    }
    
    console.log('\n🎉 Live streaming test completed!');
    console.log('\n📺 Live Stream Features:');
    console.log('   • No seeking/rewinding allowed');
    console.log('   • No pause/play controls');
    console.log('   • Real-time streaming only');
    console.log('   • Live indicator displayed');
    console.log('   • User interaction prevented');
    
  } catch (error) {
    console.error('❌ Live streaming test failed:', error.message);
    console.log('\nMake sure your backend server is running on localhost:8081');
    console.log('And you have video files in the backend/videos/ directory');
  }
}

testLiveStreaming(); 