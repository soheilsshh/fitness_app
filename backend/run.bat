@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Fitness backend launcher — checks prerequisites step by step, then starts the API server.
REM Database and tables are created automatically on startup (see config/database.go).

cd /d "%~dp0"

set STEP=0
set FAILURES=0

echo ========================================
echo  Fitness Backend — prerequisite checks
echo ========================================
echo.

call :step "Checking Go installation"
where go >nul 2>&1
if errorlevel 1 (
  call :die "Go is not installed. Install Go 1.24+ from https://go.dev/dl/"
)
for /f "tokens=3" %%v in ('go version 2^>nul') do set "GO_VERSION=%%v"
set "GO_VERSION=!GO_VERSION:go=!"
call :ok "Go !GO_VERSION! found"

call :step "Checking Go version (need ^>= 1.24)"
for /f "delims=" %%m in ('powershell -NoProfile -Command ^
  "$v='!GO_VERSION!'; $need=[version]'1.24'; $cur=[version]($v -replace '^go',''); if ($cur -ge $need) { 'ok' } else { 'fail' }"') do set "VER_CHECK=%%m"
if /i not "!VER_CHECK!"=="ok" (
  call :die "Go !GO_VERSION! is too old. This project requires Go 1.24 or newer."
)
call :ok "Go version satisfies requirement"

call :step "Checking project layout"
if not exist "go.mod" call :die "go.mod not found. Run this script from the backend\ directory."
if not exist "cmd\main.go" call :die "cmd\main.go not found."
call :ok "backend module layout looks correct"

call :step "Checking environment file (.env)"
if not exist ".env" (
  if exist "env.example" (
    copy /y "env.example" ".env" >nul
    call :warn ".env was missing — created from env.example"
    call :warn "Edit .env if your MySQL user/password differ from the defaults"
  ) else (
    call :die ".env is missing and env.example was not found"
  )
) else (
  call :ok ".env exists"
)

call :load_env_defaults
call :ok "Using DB !DB_USER!@!DB_HOST!:!DB_PORT!/!DB_NAME!"

call :step "Checking MySQL server (!DB_HOST!:!DB_PORT!)"
for /f "delims=" %%r in ('powershell -NoProfile -Command ^
  "try { $r = Test-NetConnection -ComputerName '!DB_HOST!' -Port !DB_PORT! -WarningAction SilentlyContinue; if ($r.TcpTestSucceeded) { 'ok' } else { 'fail' } } catch { 'fail' }"') do set "MYSQL_CHECK=%%r"
if /i not "!MYSQL_CHECK!"=="ok" (
  call :die "Cannot reach MySQL at !DB_HOST!:!DB_PORT!. Start MySQL and verify DB_HOST/DB_PORT in .env"
)
call :ok "MySQL port is open on !DB_HOST!:!DB_PORT!"

call :step "Downloading Go module dependencies"
go mod download
if errorlevel 1 call :die "go mod download failed"
call :ok "Dependencies ready"

call :step "Verifying backend compiles"
go build -o nul ./cmd
if errorlevel 1 call :die "go build ./cmd failed"
call :ok "Build check passed"

call :step "Preparing upload directory"
if not exist "!UPLOAD_DIR!" mkdir "!UPLOAD_DIR!"
call :ok "Upload directory ready: !UPLOAD_DIR!\"

echo.
if !FAILURES! GTR 0 (
  call :die "!FAILURES! check(s) failed"
)

echo ========================================
echo  All checks passed — starting server
echo ========================================
echo.
echo   API:     http://localhost:!PORT!
echo   Swagger: http://localhost:!PORT!/swagger/index.html
echo   DB:      !DB_USER!@!DB_HOST!:!DB_PORT!/!DB_NAME!
echo.
echo   Database and tables are created automatically if missing.
echo   Default admin: admin@gmail.com / 12345678
echo.
echo   Press Ctrl+C to stop.
echo.

go run ./cmd
exit /b %ERRORLEVEL%

:step
set /a STEP+=1
echo [!STEP!] %~1
exit /b 0

:ok
echo     OK %~1
exit /b 0

:warn
echo     WARN %~1
exit /b 0

:fail
set /a FAILURES+=1
echo     FAIL %~1
exit /b 0

:die
call :fail %~1
echo.
echo Fix the issue above and run run.bat again.
exit /b 1

:load_env_defaults
set "DB_HOST=localhost"
set "DB_PORT=3306"
set "DB_USER=root"
set "DB_NAME=fitness_db"
set "PORT=8080"
set "UPLOAD_DIR=uploads"
if not exist ".env" exit /b 0
for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
  set "KEY=%%a"
  set "VAL=%%b"
  if defined KEY (
    for /f "tokens=*" %%k in ("!KEY!") do set "KEY=%%k"
    for /f "tokens=*" %%v in ("!VAL!") do set "VAL=%%v"
    if /i "!KEY!"=="DB_HOST" set "DB_HOST=!VAL!"
    if /i "!KEY!"=="DB_PORT" set "DB_PORT=!VAL!"
    if /i "!KEY!"=="DB_USER" set "DB_USER=!VAL!"
    if /i "!KEY!"=="DB_NAME" set "DB_NAME=!VAL!"
    if /i "!KEY!"=="PORT" set "PORT=!VAL!"
    if /i "!KEY!"=="UPLOAD_DIR" set "UPLOAD_DIR=!VAL!"
  )
)
exit /b 0
