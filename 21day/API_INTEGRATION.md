# API Integration Documentation

## Overview
This React frontend is now fully connected to the Go backend API running at `46.34.163.209:8080`.

## API Endpoints

### Base URL
```
http://46.34.163.209:8080/api
```

### Available Endpoints

1. **User Registration**
   - `POST /register`
   - Registers new users and sends welcome SMS
   - Body: `{ first_name, last_name, phone }`

2. **Get Videos**
   - `GET /videos`
   - Returns all available videos with details

3. **Complete Video**
   - `POST /videos/:id/complete?phone=:phone`
   - Marks video as completed and sends completion SMS

4. **Unlock Video**
   - `POST /videos/:id/unlock?phone=:phone`
   - Unlocks a video for a user

5. **Get User Progress**
   - `GET /progress?phone=:phone`
   - Returns user's progress, points, level, and completion status

## Frontend Features

### User Management
- **Persistent Login**: User phone number is stored in localStorage
- **Auto-redirect**: Logged-in users are redirected to videos page
- **Protected Routes**: Videos page requires authentication

### Video System
- **Real-time Progress**: Fetches and displays user progress from API
- **Video Completion**: Marks videos as completed via API
- **Code Unlocking**: Unlocks next videos using codes
- **Points & Levels**: Calculates and displays user level based on points

### SMS Integration
- **Welcome SMS**: Sent automatically on registration
- **Follow-up SMS**: Scheduled based on user progress
- **Completion SMS**: Sent when videos are completed

## Error Handling
- **API Error Handling**: Graceful error handling for API failures
- **Loading States**: Loading spinners during API calls
- **Error Boundaries**: Catches and displays React errors
- **Toast Notifications**: User-friendly error messages

## User Flow
1. User registers on homepage
2. Redirected to thank you page
3. Can access videos page (protected route)
4. Watch and complete videos
5. Unlock next videos with codes
6. Track progress and earn points

## Technical Implementation

### API Service (`src/lib/api.ts`)
- Centralized API client
- TypeScript interfaces for all data types
- Error handling and request/response typing

### User Hook (`src/hooks/useUser.ts`)
- Manages user state across the app
- Handles localStorage persistence
- Provides login/logout functionality

### Protected Routes
- Route guards for authenticated pages
- Automatic redirects for unauthenticated users

### Loading & Error States
- Loading spinners during API calls
- Error boundaries for React errors
- Toast notifications for user feedback 