# Telegram Bot API - cURL Examples

## 🔐 Authentication

All bot API requests require:
- `Authorization: Bearer YOUR_API_KEY` header
- `X-Telegram-User-ID: TELEGRAM_USER_ID` header (for user mapping)

## 📋 Content Tasks API

### List Content Tasks

```bash
curl -X GET "https://webinar.sianacademy.com/api/bot/content-tasks?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Telegram-User-ID: 123456789" \
  -H "Content-Type: application/json"
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (`final_ideas`, `writing`, `pre_production`, `recording`, `editing`, `published`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `search` (optional): Search in title and description

**Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "ویدیو معرفی محصول",
      "description": "ویدیو معرفی محصول جدید",
      "status": "final_ideas",
      "priority": "high",
      "tags": ["ویدیو", "محصول"],
      "creator_id": 1,
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Get Single Content Task

```bash
curl -X GET "https://webinar.sianacademy.com/api/bot/content-tasks/1" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Telegram-User-ID: 123456789" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "task": {
    "id": 1,
    "title": "ویدیو معرفی محصول",
    "description": "ویدیو معرفی محصول جدید",
    "status": "final_ideas",
    "priority": "high",
    "tags": ["ویدیو", "محصول"],
    "creator_id": 1,
    "due_date": "2024-01-15T00:00:00Z",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### Update Content Task Status

```bash
curl -X PUT "https://webinar.sianacademy.com/api/bot/content-tasks/1" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Telegram-User-ID: 123456789" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "writing"
  }'
```

**Request Body:**
```json
{
  "status": "writing",          // Optional: new status
  "priority": "high",           // Optional: new priority
  "title": "New Title",         // Optional: new title
  "description": "New desc"     // Optional: new description
}
```

**Response:**
```json
{
  "task": {
    "id": 1,
    "title": "ویدیو معرفی محصول",
    "status": "writing",
    ...
  }
}
```

### Create Content Task

```bash
curl -X POST "https://webinar.sianacademy.com/api/bot/content-tasks" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Telegram-User-ID: 123456789" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ویدیو جدید",
    "description": "توضیحات ویدیو",
    "status": "final_ideas",
    "priority": "medium"
  }'
```

**Request Body:**
```json
{
  "title": "ویدیو جدید",           // Required
  "description": "توضیحات",        // Optional
  "status": "final_ideas",          // Optional (default: final_ideas)
  "priority": "medium",             // Optional (default: medium)
  "tags": ["ویدیو"],               // Optional
  "due_date": "2024-01-15T00:00:00Z"  // Optional
}
```

**Response:**
```json
{
  "task": {
    "id": 2,
    "title": "ویدیو جدید",
    "status": "final_ideas",
    ...
  }
}
```

## 🔍 Status Values

### Content Task Statuses

- `final_ideas` - 💡 ایده‌های نهایی
- `writing` - ✍️ نوشتن
- `pre_production` - 📝 قبل تولید
- `recording` - 🎬 ضبط
- `editing` - ✂️ تدوین
- `published` - ✅ منتشر شده

### Priority Values

- `low` - 🔵 کم
- `medium` - 🟡 متوسط
- `high` - 🟠 زیاد
- `urgent` - 🔴 فوری

## 🧪 Testing Examples

### Test with Filter

```bash
# Get only "writing" status tasks
curl -X GET "https://webinar.sianacademy.com/api/bot/content-tasks?status=writing&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Telegram-User-ID: 123456789"
```

### Test with Search

```bash
# Search for tasks containing "ویدیو"
curl -X GET "https://webinar.sianacademy.com/api/bot/content-tasks?search=ویدیو" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Telegram-User-ID: 123456789"
```

### Test Status Update

```bash
# Move task from "final_ideas" to "writing"
curl -X PUT "https://webinar.sianacademy.com/api/bot/content-tasks/1" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Telegram-User-ID: 123456789" \
  -H "Content-Type: application/json" \
  -d '{"status": "writing"}'
```

## ⚠️ Error Responses

### Unauthorized (401)
```json
{
  "error": "Invalid API key"
}
```

### Not Found (404)
```json
{
  "error": "Content task not found"
}
```

### Forbidden (403)
```json
{
  "error": "You can only view your own content tasks"
}
```

### Bad Request (400)
```json
{
  "error": "Invalid request: status field is required"
}
```

## 📝 Notes

1. All dates are in ISO 8601 format (UTC)
2. Telegram User ID must be mapped to Admin User ID via content license
3. Users can only access their own content tasks (creator_id = admin_user_id)
4. API key should be stored securely and never exposed in logs

