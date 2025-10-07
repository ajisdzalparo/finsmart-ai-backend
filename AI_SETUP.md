# AI Setup Guide

## Environment Variables

Buat file `.env` di folder backend dengan konfigurasi berikut:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finsmart"

# JWT
JWT_SECRET="your-jwt-secret-key-change-this-in-production"

# DeepSeek API (Dapatkan dari https://platform.deepseek.com/)
DEEPSEEK_API_KEY="sk-your-deepseek-api-key-here"
DEEPSEEK_MODEL="deepseek-chat"

# Gemini API (Dapatkan dari https://makersuite.google.com/app/apikey)
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-1.5-flash"

# Default Model (deepseek | gemini)
DEFAULT_AI_MODEL=deepseek

# Server
PORT=4000
NODE_ENV=development
```

## Setup AI APIs

### 1. DeepSeek API

1. Daftar di https://platform.deepseek.com/
2. Buat API key
3. Masukkan ke `DEEPSEEK_API_KEY`

### 2. Gemini API

1. Daftar di https://makersuite.google.com/app/apikey
2. Buat API key
3. Masukkan ke `GEMINI_API_KEY`

## Fallback Behavior

Jika API key tidak dikonfigurasi, sistem akan:

- Menggunakan fallback insights dengan format mata uang yang benar
- Tidak menampilkan error, hanya warning di console
- Tetap berfungsi normal tanpa AI features

## Testing

Setelah setup, test dengan:

```bash
npm run dev
```

Cek console untuk memastikan tidak ada error API.
