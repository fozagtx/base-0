# Base0 - AI Avatar Playground

Fast avatar inference with optimized performance using Google Gemini AI and React Flow.

## Features

- 🎨 **AI-Powered Avatar Generation** - Real-time avatar creation using Google Gemini 2.5 Flash
- 🔄 **Interactive Node Workflow** - Drag, connect, and manipulate nodes visually
- 📁 **File Upload System** - Upload base objects for avatars to hold
- ⚡ **Optimized Performance** - Built with Next.js 15, Bun, and Tailwind CSS
- 🎯 **Clean Design** - Minimalist black/white aesthetic with Geist font
- 🔗 **Smart Connections** - Connect nodes to combine objects with avatars

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Google AI Studio API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edge-ai-avatar
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Google AI API key:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here
   ```
   
   Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

4. **Run the development server**
   ```bash
   bun dev
   ```

5. **Open the app**
   Open [http://localhost:3003](http://localhost:3003) in your browser

## Usage

1. **Connect Wallet** - Click the connect wallet button (UI only, no real wallet integration)
2. **Add Nodes** - Click the + button to add new avatar nodes
3. **Upload Objects** - Click upload nodes to add base objects (medicine, tools, etc.)
4. **Generate Avatars** - Click a node and press 'P' to open the prompt modal
5. **Connect Workflows** - Drag between nodes to create connections
6. **Delete Nodes** - Hover over nodes and click the × button to delete

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **AI**: Google Gemini 2.5 Flash via @ai-sdk/google
- **Workflow**: React Flow
- **Font**: Geist
- **Language**: TypeScript

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
