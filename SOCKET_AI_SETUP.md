# Socket.IO AI Setup Guide

## Overview

Aplikasi FinSmartAI sekarang menggunakan Socket.IO untuk komunikasi real-time dengan AI models (DeepSeek dan Gemini).

## Features

- ✅ Real-time AI communication via Socket.IO
- ✅ Support untuk DeepSeek AI (free tier)
- ✅ Support untuk Gemini AI (free tier)
- ✅ Model switching (DeepSeek ↔ Gemini)
- ✅ Fallback data ketika AI API tidak tersedia
- ✅ Progress indicators dan status updates
- ✅ Authentication via JWT token

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install socket.io
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install socket.io-client @radix-ui/react-switch @radix-ui/react-label
npm run dev
```

### 3. Environment Variables

Buat file `.env` di root backend:

```env
# AI API Keys (optional - akan menggunakan fallback jika tidak ada)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=4000
FRONTEND_URL=http://localhost:8080
JWT_SECRET=your_jwt_secret_here
```

### 4. AI API Keys (Optional)

Jika ingin menggunakan AI API yang sebenarnya:

#### DeepSeek API

1. Daftar di https://platform.deepseek.com/
2. Dapatkan API key
3. Tambahkan ke `.env`: `DEEPSEEK_API_KEY=your_key_here`

#### Gemini API

1. Daftar di https://makersuite.google.com/app/apikey
2. Dapatkan API key
3. Tambahkan ke `.env`: `GEMINI_API_KEY=your_key_here`

## Usage

### 1. Akses Real-time AI Chat

1. Login ke aplikasi
2. Pergi ke halaman "AI Assistant"
3. Klik tab "Real-time AI"
4. Pilih model AI (DeepSeek atau Gemini)
5. Klik template untuk memulai chat

### 2. Socket.IO Events

#### Client → Server

- `ai:request` - Request AI analysis
- `ai:switch-model` - Switch AI model

#### Server → Client

- `ai:response` - AI analysis result
- `ai:progress` - Progress updates
- `ai:model-switched` - Model switch confirmation

### 3. AI Request Format

```typescript
{
  type: 'insights' | 'recommendations' | 'dashboard',
  model?: 'deepseek' | 'gemini',
  userId: string
}
```

### 4. AI Response Format

```typescript
{
  type: 'insights' | 'recommendations' | 'dashboard',
  data: any[],
  status: 'success' | 'error',
  message?: string,
  model?: string
}
```

## Fallback System

Jika AI API tidak tersedia atau gagal:

- ✅ Menggunakan data transaksi yang ada
- ✅ Generate insights berdasarkan analisis data
- ✅ Memberikan rekomendasi berdasarkan pola spending
- ✅ Tetap memberikan value meskipun tanpa AI external

## Troubleshooting

### 1. Socket.IO Connection Failed

- Pastikan backend berjalan di port 4000
- Check CORS settings di backend
- Pastikan JWT token valid

### 2. AI Response Empty

- Check console log untuk error messages
- Pastikan ada data transaksi di database
- AI akan menggunakan fallback jika API key tidak ada

### 3. Model Switching Not Working

- Pastikan Socket.IO connection aktif
- Check browser console untuk error
- Refresh halaman jika perlu

## Development Notes

### Socket.IO Service Structure

```
backend/src/services/socket.service.ts
├── Authentication middleware
├── AI request handlers
├── Progress tracking
└── Error handling
```

### Frontend Hook Structure

```
frontend/src/hooks/useSocket.ts
├── Connection management
├── AI request methods
├── Model switching
└── Response handling
```

### Components

```
frontend/src/components/ai/
├── SocketAIChat.tsx - Real-time AI chat
├── TemplatedChat.tsx - Traditional API chat
└── TemplatedAssistant.tsx - Legacy assistant
```

## Performance Tips

1. AI requests memiliki timeout 30 detik
2. Fallback responses sangat cepat (< 1 detik)
3. Socket.IO menggunakan WebSocket dengan polling fallback
4. Progress indicators memberikan feedback real-time

## Security

- ✅ JWT authentication required
- ✅ User isolation via Socket.IO rooms
- ✅ Input validation dan sanitization
- ✅ Rate limiting (dapat ditambahkan jika perlu)
