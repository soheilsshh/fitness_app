# MonetizeAI Webinar Backend

This is the backend for the MonetizeAI Webinar app, built with Go, Gin, Viper, and MySQL.

## Features
- User registration
- Webinar info and state
- Live chat (with admin controls)
- Admin panel endpoints

## Tech Stack
- [Gin](https://github.com/gin-gonic/gin) — Web framework
- [Viper](https://github.com/spf13/viper) — Configuration
- [MySQL](https://www.mysql.com/) — Database

## Directory Structure
```
backend/
  cmd/main.go
  config/config.go
  controllers/
    user.go
    chat.go
    webinar.go
    admin.go
  models/
    user.go
    chat.go
    webinar.go
  routes/routes.go
  services/
    user_service.go
    chat_service.go
    webinar_service.go
  utils/utils.go
  .env
  go.mod
  go.sum
```

## Setup
1. Install Go 1.20+ and MySQL.
2. Copy `.env.example` to `.env` and set your DB credentials.
3. Run `go mod tidy` in the backend directory.
4. Start the server: `go run cmd/main.go`

## API Endpoints
- `POST /api/register` — Register a user
- `GET /api/webinar` — Get webinar info
- `GET /api/chat` — Get chat messages
- `POST /api/chat` — Post a chat message
- `GET /api/admin/state` — Get admin state
- `POST /api/admin/pin` — Set pinned message
- `POST /api/admin/chat-toggle` — Enable/disable chat 