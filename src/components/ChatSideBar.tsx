"use client";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import SubscriptionButton from "./SubscriptionButton";

import FileUpload from "./FileUpload";
import { X } from "lucide-react";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
  isPro: boolean;
};

const ChatSideBar = ({ chats, chatId, isPro }: Props) => {
  const [showUploadModal, setShowUploadModal] = React.useState(false);

  return (
    <div className="w-full max-h-screen overflow-scroll soff p-4 text-gray-200 bg-gray-900 flex flex-col h-full">
      <Button
        onClick={() => setShowUploadModal(true)}
        className="w-full border-dashed border-slate-600 border bg-slate-800 hover:bg-slate-700 text-white font-semibold py-5"
      >
        <PlusCircle className="mr-2 w-4 h-4 text-blue-400" />
        New Chat
      </Button>

      <div className="flex max-h-screen overflow-scroll pb-20 flex-col gap-2 mt-4 flex-1">
        {chats.map((chat) => (
          <Link key={chat.id} href={`/chat/${chat.id}`}>
            <div
              className={cn("rounded-lg p-3 text-slate-300 flex items-center transition", {
                "bg-blue-600 text-white font-semibold": chat.id === chatId,
                "hover:bg-slate-800 hover:text-white": chat.id !== chatId,
              })}
            >
              <MessageCircle className="mr-2 w-4 h-4 shrink-0" />
              <p className="w-full overflow-hidden text-xs truncate whitespace-nowrap text-ellipsis">
                {chat.pdfName}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-800">
        <SubscriptionButton isPro={isPro} />
      </div>

      {/* New Chat Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative text-left">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-500" /> Upload New PDF Document
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select or drop a new PDF file to create a new AI RAG chat session.
            </p>
            <FileUpload />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSideBar;
