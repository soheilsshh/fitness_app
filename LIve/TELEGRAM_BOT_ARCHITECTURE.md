# Telegram Bot Architecture Documentation

## 📋 Overview

This document describes the clean architecture implementation for the Telegram bot integration with the Content Management Admin Panel.

## 🏗️ Architecture

```
Telegram Bot → TelegramWebhookControllerV2 → TelegramBotHandler → BotAPIClient → Backend API → Database
```

### Key Principles

1. **Separation of Concerns**: Bot handler does NOT directly access database
2. **API-First**: All operations go through REST API endpoints
3. **Secure Authentication**: API key-based authentication for bot API calls
4. **User Mapping**: Telegram user IDs are mapped to Admin user IDs via content licenses

## 📁 File Structure

```
backend/
├── services/
│   ├── telegram_bot.go                    # Core Telegram bot service (send messages, webhooks)
│   ├── telegram_bot_api_client.go         # API client for backend communication
│   ├── telegram_bot_handler.go            # Bot command/message handler logic
│   └── telegram_bot_logger.go             # Structured logging for bot
├── controllers/
│   ├── telegram_webhook_v2.go             # V2 webhook handler (API-based)
│   ├── telegram_webhook.go                # V1 webhook handler (legacy, direct DB)
│   ├── bot_api_auth.go                    # API key authentication middleware
│   └── bot_user_mapper.go                 # Maps Telegram user ID to Admin user ID
└── routes/
    └── routes.go                          # Route definitions (V2 handler if API key set)
```

## 🔐 Authentication

### API Key Setup

1. **Generate API Key**: Create a secure random string (e.g., using `openssl rand -hex 32`)

2. **Add to Config**: Update `backend/config.yaml`:
```yaml
telegram:
  bot_token: "YOUR_BOT_TOKEN"
  webhook_url: "https://your-domain.com/webhook/telegram"
  api_key: "your-secure-api-key-here"  # Add this
  enabled: true
```

3. **Environment Variable** (Alternative): Set `TELEGRAM_BOT_API_KEY` environment variable

### Authentication Flow

1. Bot handler sets Telegram user ID in API client
2. API client includes `X-Telegram-User-ID` header in requests
3. `BotAPIAuthMiddleware` validates API key
4. Middleware maps Telegram user ID → Admin user ID via `ContentLicense` table
5. Admin user ID is set in context for API endpoints

## 🔌 API Endpoints

### Bot API Routes (API Key Auth)

All bot API routes are prefixed with `/api/bot/` and require API key authentication:

- `GET /api/bot/content-tasks` - List content tasks
- `GET /api/bot/content-tasks/:id` - Get single content task
- `POST /api/bot/content-tasks` - Create content task
- `PUT /api/bot/content-tasks/:id` - Update content task

### Request Headers

```http
Authorization: Bearer YOUR_API_KEY
X-Telegram-User-ID: 123456789
Content-Type: application/json
```

## 📝 Bot Commands

- `/start` - Welcome message and instructions
- `/help` - Help documentation
- `/list` - Show content tasks list (with pagination)
- `/stats` - Show content statistics (to be implemented)

## 🎨 Inline Keyboards

### List View
- Status filter buttons (💡 ایده‌ها, ✍️ نوشتن, etc.)
- Task buttons (click to view details)
- Pagination buttons (◀️ قبلی, ▶️ بعدی)

### Task Details View
- Status update buttons (move to next/previous status)
- Back to list button

## 🔄 Content Task Statuses

1. `final_ideas` - 💡 ایده‌های نهایی
2. `writing` - ✍️ نوشتن
3. `pre_production` - 📝 قبل تولید
4. `recording` - 🎬 ضبط
5. `editing` - ✂️ تدوین
6. `published` - ✅ منتشر شده

## 📊 Logging

All bot interactions are logged with structured format:

```
[Telegram Bot] [COMMAND] User:123456789 Command:list Time:2024-01-01T12:00:00Z
[Telegram Bot] [MESSAGE] User:123456789 Text:/start Time:2024-01-01T12:00:01Z
[Telegram Bot] [CALLBACK] User:123456789 Data:task:123 Time:2024-01-01T12:00:02Z
[Telegram Bot] [API] Endpoint:GetContentTasks Params:page=1 Time:2024-01-01T12:00:03Z
```

## 🚀 Deployment

### Step 1: Generate API Key

```bash
# Generate a secure API key
openssl rand -hex 32
```

### Step 2: Update Config

Edit `backend/config.yaml`:
```yaml
telegram:
  api_key: "your-generated-api-key-here"
```

### Step 3: Deploy

```bash
cd /var/www/monetizeai-live-webinar/backend/
git pull
go build -o webinar_backend cmd/main.go
supervisorctl restart webinar_backend
```

### Step 4: Verify Webhook

The system will automatically use V2 handler (API-based) if API key is configured, otherwise falls back to V1 (legacy).

Check logs:
```bash
supervisorctl tail -100 webinar_backend | grep "Telegram webhook"
```

## 🧪 Testing

### Test Webhook Endpoint

```bash
curl -X POST https://your-domain.com/webhook/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "from": {
        "id": 123456789,
        "first_name": "Test",
        "is_bot": false
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "date": 1234567890,
      "text": "/start"
    }
  }'
```

Expected response: `{"ok":true}`

### Test Bot API Endpoint

```bash
curl -X GET "https://your-domain.com/api/bot/content-tasks?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Telegram-User-ID: 123456789"
```

### Test User Mapping

Ensure the Telegram user has activated a content license:
1. User activates license via `/start` → license code
2. System maps Telegram ID to Admin User ID
3. Bot API requests include `X-Telegram-User-ID` header
4. Middleware maps to Admin User ID and sets in context

## 🔧 Configuration

### Required Config

```yaml
telegram:
  bot_token: "YOUR_BOT_TOKEN"
  webhook_url: "https://your-domain.com/webhook/telegram"
  api_key: "your-secure-api-key"  # Required for V2 handler
  enabled: true
```

### Optional Config

- If `api_key` is empty, system uses V1 handler (legacy, direct DB access)
- If `api_key` is set, system uses V2 handler (API-based, recommended)

## 📚 Code Examples

### Creating Bot Handler

```go
// In telegram_webhook_v2.go
apiClient := services.NewBotAPIClient(apiBaseURL, apiKey)
botHandler := services.NewTelegramBotHandler(botService, apiClient)
```

### Handling Commands

```go
// In telegram_bot_handler.go
func (h *TelegramBotHandler) HandleCommand(chatID int64, userID int64, command string, args []string) {
    h.APIClient.SetTelegramUserID(userID)  // Set user ID for API calls
    // ... handle command
}
```

### API Client Usage

```go
// Get content tasks
tasks, err := apiClient.GetContentTasks("final_ideas", "", 1, 10)

// Update task status
err := apiClient.UpdateContentTaskStatus(taskID, "writing")

// Get single task
task, err := apiClient.GetContentTask(taskID)
```

## 🐛 Troubleshooting

### Bot not responding

1. Check webhook is set:
```bash
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

2. Check backend logs:
```bash
supervisorctl tail -f webinar_backend | grep "Telegram"
```

3. Verify API key is set in config.yaml

4. Check nginx config includes `/webhook/` location

### API authentication fails

1. Verify API key in config.yaml matches the one used in requests
2. Check `X-Telegram-User-ID` header is included
3. Verify user has activated content license

### User mapping fails

1. Check content license exists for Telegram user ID
2. Verify license is activated (`is_used = true`)
3. Check `telegram_id` field in `content_licenses` table

## 🔒 Security Considerations

1. **API Key**: Store securely, never commit to git
2. **User Mapping**: Only users with activated licenses can use bot
3. **Rate Limiting**: Consider adding rate limiting for bot API endpoints
4. **Input Validation**: All inputs are validated by backend API

## 📈 Future Enhancements

- [ ] Add content statistics endpoint
- [ ] Implement task creation via bot
- [ ] Add search functionality
- [ ] Implement notifications for task updates
- [ ] Add role-based access control for bot features

