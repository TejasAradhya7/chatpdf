# 🤖 ChatPDF AI Studio

> An enterprise-grade AI-powered document analysis system built with **Google Gemini**, **RAG (Retrieval-Augmented Generation)**, and a beautiful **resizable 3-panel workspace**.

Upload any PDF and instantly chat with it — ask questions, extract data, and get accurate answers with page citations powered by Google Gemini 3.6 Flash.

---

## ✨ Features

- **📄 PDF Upload & Preview** — Drag & drop any PDF; view it live alongside your conversation
- **🤖 Gemini-Powered RAG** — Uses Google Gemini 3.6 Flash for intelligent, context-aware responses
- **📌 Page Citations** — Every AI answer references the exact page in your document
- **🧠 Vector Semantic Search** — Pinecone vector DB retrieves the most relevant chunks for each query
- **💬 Multi-Document Chat** — Upload multiple PDFs and switch between them from the sidebar
- **↔️ Resizable 3-Panel Workspace** — Drag handles to freely resize Sidebar, PDF Preview, and AI Chat Studio
- **🌙 Premium Dark UI** — Glassmorphism-inspired dark design with smooth micro-animations
- **☁️ Cloud PDF Storage** — PDFs stored in Supabase Storage; embeddings in Pinecone

---

## 🏗️ Architecture

**1. User uploads a PDF** → File is sent to `/api/create-chat` via drag & drop on the home page.

**2. PDF is stored** → The raw PDF file is uploaded to **Supabase Storage** (cloud CDN) and the URL is saved in **Neon PostgreSQL** via Drizzle ORM.

**3. Text is parsed & chunked** → `pdf-parse` extracts all text from the PDF, which is split into overlapping ~1000 character chunks for better context coverage.

**4. Chunks are embedded** → Each chunk is sent to **Google Gemini `gemini-embedding-001`** to generate a 768-dimensional vector representing its semantic meaning.

**5. Vectors stored in Pinecone** → All chunk embeddings are stored in a **Pinecone serverless vector index** (namespaced per chat) for fast semantic retrieval.

**6. User asks a question** → The question is embedded into a 768-dim vector and a **cosine similarity search** is run against Pinecone to fetch the top 5 most relevant PDF chunks.

**7. Context is built & sent to Gemini** → The retrieved chunks + chat history + user question are combined into a prompt and sent to **Google Gemini 3.6 Flash**, which streams back a response.

**8. Response is saved & displayed** → The AI answer is saved to **Neon PostgreSQL** and rendered in the UI with formatted markdown and page citation badges (🏷️ Page X).

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 14 (App Router) |
| **UI Styling** | Tailwind CSS + Custom dark theme |
| **AI / LLM** | Google Gemini 3.6 Flash |
| **Embeddings** | Google gemini-embedding-001 (768-dim) |
| **Vector Database** | Pinecone (serverless) |
| **Relational Database** | Neon PostgreSQL (serverless) |
| **ORM** | Drizzle ORM |
| **PDF Storage** | Supabase Storage |
| **PDF Parsing** | pdf-parse |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                   # Landing page — Upload PDF
│   ├── layout.tsx                 # Root layout
│   ├── chat/[chatId]/page.tsx     # Chat workspace (3-panel resizable)
│   └── api/
│       ├── create-chat/route.ts   # PDF upload → parse → embed → store
│       ├── chat/route.ts          # RAG pipeline → Gemini → stream
│       ├── get-messages/route.ts  # Fetch chat history from DB
│       └── upload-local/route.ts  # Local PDF upload handler
├── components/
│   ├── ChatComponent.tsx          # AI chat input + streaming messages
│   ├── ChatSideBar.tsx            # All chats list + New Chat modal
│   ├── MessageList.tsx            # Formatted markdown message renderer
│   ├── PDFViewer.tsx              # Native iframe PDF preview
│   ├── FileUpload.tsx             # Drag-and-drop PDF uploader
│   └── ResizableWorkspace.tsx     # Drag-handle resizable 3-panel layout
└── lib/
    ├── db/
    │   ├── index.ts               # Drizzle DB connection
    │   └── schema.ts              # chats + messages tables
    ├── embeddings.ts              # Google Gemini embedding logic
    ├── context.ts                 # Pinecone semantic search / RAG context
    ├── pinecone.ts                # Pinecone client init
    ├── supabase-storage.ts        # Supabase PDF upload helper
    └── subscription.ts            # Subscription / Pro check
```

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/TejasAradhya7/chatpdf.git
cd chatpdf
npm install
```

### 2. Set up environment variables
Create a `.env` file in the root:
```env
# Database (Neon PostgreSQL)
DATABASE_URL=your_neon_database_url

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Pinecone Vector DB
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=chatpdf

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run DB migrations
```bash
npx drizzle-kit push:pg
```

### 4. Create Pinecone index
```bash
node create-index.js
```

### 5. Start the dev server
```bash
npm run dev
```

Visit **http://localhost:3000** and upload your first PDF!

---

## 📸 Workspace Layout

```
┌──────────────┬──────────────────────────┬────────────────────────┐
│              │                          │                        │
│   Sidebar    │     PDF Document         │   AI Chat Studio       │
│              │      Preview             │                        │
│  • Chat 1    │  ┌────────────────────┐  │  You: What is this?   │
│  • Chat 2    │  │                    │  │                        │
│  • Chat 3    │  │  [PDF renders      │  │  AI: This document    │
│              │  │   here natively]   │  │  discusses... 🏷️ P.3  │
│  + New Chat  │  │                    │  │                        │
│              │  └────────────────────┘  │  [Type a question...] │
│              │                          │                        │
└──────────────┴──────────────────────────┴────────────────────────┘
  ↕ Drag handle           ↕ Drag handle
  (resize sidebar)        (resize chat panel)
```

---

## 📄 License

MIT © Tejas Aradhya
