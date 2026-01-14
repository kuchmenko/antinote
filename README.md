# Antinote

**Your second brain, voice-first.**

Antinote is a premium, AI-powered daily operating system designed to capture, structure, and organize your thoughts effortlessly. Speak your mind, and let the neural interface handle the rest.

## ✨ Features

### Core Experience

**Voice-First Capture**
- **Real-time streaming transcription**: Speak naturally and see text appear instantly via OpenAI Realtime
- **Batch transcription**: Upload audio files for high-quality transcription with Whisper
- **Multi-channel capture**: Record via web app or send voice/text notes through Telegram bot

### AI-Powered Structure

**Smart Organization**
- **Automatic categorization**: AI analyzes and structures your notes into Tasks, Ideas, Worries, or Plans
- **Open Loops**: Trackable items extracted from your notes that you can complete, snooze, or carry over to the next day
- **Day Review**: End-of-day compilation with narrative recap and actionable checklist aligned with your loops
- **Semantic search**: Find relevant notes using vector embeddings, not just keyword matching

### Premium Interface

- **Aurora backgrounds**: Deep, animated mesh gradients
- **Glassmorphism**: Premium, frosted-glass aesthetics
- **3D interactivity**: Floating "Neural Orb" and 3D tilt effects on cards
- **Interactive cursor**: Physics-based custom cursor with magnetic hover effects

### Secure Foundation

- **Authentication**: Powered by Clerk
- **Storage**: Neon (Serverless Postgres) + Drizzle ORM
- **Privacy-first design**: Transparent data provenance, source entry tracking

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion, React Three Fiber (R3F)
- **Database**: Neon (Serverless Postgres) + Drizzle ORM
- **Auth**: Clerk
- **AI**: OpenAI (Whisper, GPT models, Embeddings, Realtime)
- **Deployment**: Cloudflare Workers (realtime transcription proxy)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API Key
- Clerk API Keys
- Neon Database URL

### Installation

```bash
git clone https://github.com/kuchmenko/antinote.git
cd antinote
npm install
```

### Configuration

Create a `.env.local` file:

```env
# AI & Database
OPENAI_API_KEY=sk-...
DATABASE_URL=postgres://...

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📄 License

MIT
