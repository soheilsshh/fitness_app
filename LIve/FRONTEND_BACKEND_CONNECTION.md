# Frontend-Backend Connection

This document explains how the frontend connects to the backend API.

## Configuration

The frontend is configured to connect to the backend running on `localhost:8081` by default.

### Environment Variables

You can override the API base URL using the `VITE_API_BASE_URL` environment variable:

```bash
# .env file
VITE_API_BASE_URL=http://localhost:8081/api
```

## API Endpoints

The frontend connects to the following backend endpoints:

- `POST /api/register` - User registration
- `GET /api/webinar` - Get webinar information
- `GET /api/chat` - Get chat messages
- `POST /api/chat` - Post a chat message
- `GET /video/:video` - Stream video files

## Components Updated

The following components have been updated to use the real API:

1. **RegisterPage** - Now sends registration data to the backend
2. **LiveChat** - Fetches and posts real chat messages
3. **LiveWebinar** - Fetches real webinar information
4. **VideoPlayer** - Streams videos from backend with range support

## Error Handling

- API calls include proper error handling with fallbacks
- Chat component falls back to mock messages if API fails
- Registration shows error toasts on failure
- All API errors are logged to console for debugging

## CORS Configuration

The backend is configured with CORS to allow requests from the frontend:

```go
r.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"*"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
}))
```

## Testing the Connection

1. Start the backend server on port 8081
2. Add video files to `backend/videos/` directory (video1.mp4, video2.mp4)
3. Start the frontend development server
4. Try registering a user - the data should be saved to the database
5. Check the chat - messages should be fetched from the backend
6. Verify webinar information is loaded from the backend
7. Test video streaming - videos should stream from backend with seeking support

## Live Streaming Setup

The backend now supports **true live streaming** with the following features:

- **No seeking allowed** - Users cannot rewind, fast-forward, or seek
- **No playback controls** - No pause, play, or volume controls
- **Real-time streaming** - Video streams frame by frame from backend
- **Live indicators** - Visual indicators show it's a live stream
- **User interaction prevention** - Overlay prevents any video manipulation
- **CORS headers** - Allows frontend to access videos
- **Security** - Prevents directory traversal attacks
- **Efficient streaming** - 64KB buffer for smooth live streaming

### Video Files
Place your video files in `backend/videos/`:
- `video1.mp4` - Default video (before 6 PM)
- `video2.mp4` - Alternative video (after 6 PM)

### Testing Live Streaming
Run the live streaming test:
```bash
node test-live-streaming.js
```

### Regular Video Streaming (with controls)
If you need regular video streaming with controls, use:
- `http://localhost:8081/video-regular/video1.mp4`

## Troubleshooting

If the connection fails:

1. Ensure the backend is running on port 8081
2. Check browser console for CORS errors
3. Verify the API endpoints are accessible
4. Check network tab for failed requests 