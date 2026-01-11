# Antinote

**Your second brain, voice-first.**

Antinote is a premium, AI-powered daily operating system designed to capture, structure, and organize your thoughts effortlessly. Speak your mind, and let the neural interface handle the rest.

![Antinote UI](https://github.com/user-attachments/assets/placeholder)

## ✨ Features

- **🎙️ Frictionless Voice Capture**: Instant recording with a holographic, Web Audio API-powered visualizer.
- **🧠 AI Processing Pipeline**:
    - **Transcription**: Powered by OpenAI Whisper.
    - **Structuring**: GPT-4o analyzes and categorizes notes into Tasks, Ideas, Worries, or Plans.
- **💎 Exclusive UI**:
    - **Aurora Backgrounds**: Deep, animated mesh gradients.
    - **Glassmorphism**: Premium, frosted-glass aesthetics.
    - **3D Interactivity**: Floating "Neural Orb" and 3D tilt effects on cards.
    - **Interactive Cursor**: Physics-based custom cursor with magnetic hover and focus effects.
- **🔐 Secure Authentication**: Powered by Clerk.
- **🗄️ Robust Storage**: Neon (Serverless Postgres) + Drizzle ORM.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion, React Three Fiber (R3F)
- **Database**: Neon, Drizzle ORM
- **Auth**: Clerk
- **AI**: OpenAI API

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API Key
- Clerk API Keys
- Neon Database URL

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/kuchmenko/antinote.git
    cd antinote
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env.local` file:
    ```env
    # AI & Database
    OPENAI_API_KEY=sk-...
    DATABASE_URL=postgres://...

    # Authentication (Clerk)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
    CLERK_SECRET_KEY=sk_test_...
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Open** [http://localhost:3000](http://localhost:3000)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
