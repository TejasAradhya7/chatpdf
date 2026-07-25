import ChatComponent from "@/components/ChatComponent";
import ChatSideBar from "@/components/ChatSideBar";
import PDFViewer from "@/components/PDFViewer";
import ResizableWorkspace from "@/components/ResizableWorkspace";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { checkSubscription } from "@/lib/subscription";
import { redirect } from "next/navigation";
import React from "react";
import { FileText, Sparkles } from "lucide-react";

export const revalidate = 0;

type Props = {
  params: {
    chatId: string;
  };
};

const ChatPage = async ({ params: { chatId } }: Props) => {
  let _chats: any[] = [];
  try {
    _chats = await db.select().from(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
  }

  if (!_chats || _chats.length === 0) {
    return redirect("/");
  }

  const numericChatId = parseInt(chatId);
  const currentChat = _chats.find((chat) => chat.id === numericChatId) || _chats[_chats.length - 1];
  const isPro = await checkSubscription();

  return (
    <div className="w-screen h-screen max-h-screen overflow-hidden bg-slate-900 flex flex-col">
      {/* Top Workspace Header */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2 font-extrabold text-base tracking-tight text-blue-400">
          <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
          <span>ChatPDF AI Studio & RAG Workspace</span>
        </div>
        {currentChat && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-slate-200 truncate max-w-xs">{currentChat.pdfName}</span>
          </div>
        )}
      </header>

      {/* Resizable 3-Panel Workspace: Sidebar | PDF Preview | AI Chat Studio */}
      <ResizableWorkspace
        sidebar={<ChatSideBar chats={_chats} chatId={currentChat.id} isPro={isPro} />}
        pdfViewer={<PDFViewer pdf_url={currentChat.pdfUrl} />}
        chatStudio={<ChatComponent chatId={currentChat.id} summary={currentChat.summary || ""} />}
      />
    </div>
  );
};

export default ChatPage;
