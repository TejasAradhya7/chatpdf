import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { checkSubscription } from "@/lib/subscription";
import SubscriptionButton from "@/components/SubscriptionButton";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import React from "react";

export const revalidate = 0;

export default async function Home() {
  const isPro = await checkSubscription();
  let latestChat;
  try {
    const chatsList = await db.select().from(chats);
    if (chatsList && chatsList.length > 0) {
      latestChat = chatsList[chatsList.length - 1];
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-rose-100 to-teal-100 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center text-center max-w-2xl">
        <div className="mb-3 px-4 py-1.5 bg-white/80 backdrop-blur rounded-full text-xs font-semibold text-slate-700 shadow-sm border border-slate-200/60 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>AI-Powered Document Assistant</span>
        </div>

        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
          Chat with any PDF
        </h1>

        <p className="max-w-xl text-lg text-slate-600 mb-6 leading-relaxed">
          Join millions of students, researchers and professionals to instantly
          answer questions and understand research with AI.
        </p>

        <div className="w-full">
          <FileUpload />
        </div>

        {/* Go to Active Chat Studio button linking to the latest uploaded document */}
        {latestChat && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 w-full max-w-md">
            <Link href={`/chat/${latestChat.id}`} className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                Open Chat Studio & Preview ➔ ({latestChat.pdfName})
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
