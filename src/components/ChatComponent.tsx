"use client";
import React from "react";
import { Input } from "./ui/input";
import { useChat } from "ai/react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Message } from "ai";

type Props = { chatId: number; summary?: string };

const ChatComponent = ({ chatId, summary }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<Message[]>("/api/get-messages", {
        chatId,
      });
      return response.data;
    },
  });

  const [mode, setMode] = React.useState<"chat" | "extract">("extract");
  const [customExtractQuery, setCustomExtractQuery] = React.useState("");

  const { input, handleInputChange, handleSubmit, messages, append } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
    initialMessages: data || [],
  });

  React.useEffect(() => {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleCustomExtraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExtractQuery.trim()) return;
    append({
      role: "user",
      content: `Perform structured RAG data extraction for the following requested fields/information: "${customExtractQuery}". Present extracted values in a structured Markdown table or key-value summary with page citations [Page X].`,
    });
    setCustomExtractQuery("");
    setMode("chat");
  };

  return (
    <div
      className="relative max-h-screen overflow-scroll flex flex-col h-full bg-slate-50/50"
      id="message-container"
    >
      {/* header & mode switcher */}
      <div className="sticky top-0 inset-x-0 p-3 bg-white border-b border-slate-200 z-10 flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Document AI & RAG Studio</h3>
          <p className="text-xs text-slate-500">Query and extract structured data using RAG</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setMode("chat")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              mode === "chat"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            💬 Chat Mode
          </button>
          <button
            type="button"
            onClick={() => setMode("extract")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              mode === "extract"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ⚡ RAG Extraction Studio
          </button>
        </div>
      </div>

      {/* RAG Extraction Studio Mode Panel */}
      {mode === "extract" ? (
        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl shadow-md">
            <h4 className="font-bold text-base flex items-center gap-2">
              ⚡ Custom RAG Data Extraction Entry
            </h4>
            <p className="text-xs text-blue-100 mt-1">
              Extract exact fields, structured tables, or key metrics from your uploaded PDF using vector context search.
            </p>

            <form onSubmit={handleCustomExtraction} className="mt-3 flex gap-2">
              <input
                type="text"
                value={customExtractQuery}
                onChange={(e) => setCustomExtractQuery(e.target.value)}
                placeholder="e.g. Extract invoice date, total amount, supplier name, tax ID..."
                className="w-full text-xs text-slate-900 px-3 py-2.5 rounded-lg border-0 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <Button type="submit" className="bg-slate-900 text-white text-xs px-4 whitespace-nowrap hover:bg-slate-800">
                Extract Data
              </Button>
            </form>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Popular RAG Extraction Presets:
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  append({
                    role: "user",
                    content: "Extract all numerical data, statistics, and tabular figures into a structured markdown table with [Page X] page citations.",
                  });
                  setMode("chat");
                }}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                  📊 Table & Numeric Data Extractor
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Extracts numbers, metrics, and data tables in structured Markdown.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  append({
                    role: "user",
                    content: "Extract key entity names, dates, organization names, locations, and contact details with [Page X] page citations.",
                  });
                  setMode("chat");
                }}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                  🔍 Entities & Metadata Extractor
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Extracts dates, organizations, contacts, and metadata.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  append({
                    role: "user",
                    content: "Extract key requirements, action items, deadlines, and deliverables into a clear bulleted list with [Page X] page citations.",
                  });
                  setMode("chat");
                }}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                  🎯 Requirements & Action Items
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Extracts deadlines, deliverables, and actionable takeaways.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  append({
                    role: "user",
                    content: "Extract key terms, definitions, legal clauses, and important conditions from this document with [Page X] page citations.",
                  });
                  setMode("chat");
                }}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                  ⚖️ Terms, Definitions & Clauses
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Extracts legal conditions, terms, and key definitions.
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* summary */}
          {summary && (
            <div className="mx-4 mt-4 p-4 bg-blue-50 text-blue-900 rounded-lg text-sm shadow-sm ring-1 ring-blue-200">
              <h4 className="font-semibold mb-2 text-blue-950 flex items-center gap-1.5">
                ✨ Extracted Document Insights:
              </h4>
              <p className="whitespace-pre-wrap">{summary}</p>
            </div>
          )}

          {/* Quick Extraction Actions */}
          <div className="mx-4 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">⚡ Quick RAG Data Extraction Presets:</p>
              <button
                type="button"
                onClick={() => setMode("extract")}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Open Custom Extraction Entry →
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  append({ role: "user", content: "Extract all key data points, figures, and important statistics from this document with [Page X] page citations." });
                }}
                className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm flex items-center gap-1.5 transition active:scale-95"
              >
                📊 Key Data & Figures
              </button>
              <button
                type="button"
                onClick={() => {
                  append({ role: "user", content: "Extract a structured executive summary of this document with [Page X] page citations." });
                }}
                className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm flex items-center gap-1.5 transition active:scale-95"
              >
                📝 Executive Summary
              </button>
              <button
                type="button"
                onClick={() => {
                  append({ role: "user", content: "Extract main conclusions, takeaways, and action items from this document with [Page X] page citations." });
                }}
                className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm flex items-center gap-1.5 transition active:scale-95"
              >
                🎯 Action Items & Conclusions
              </button>
            </div>
          </div>

          {/* message list */}
          <MessageList messages={messages} isLoading={isLoading} />

          <form
            onSubmit={handleSubmit}
            className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white border-t border-slate-200"
          >
            <div className="flex">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask any question or request data extraction..."
                className="w-full"
              />
              <Button className="bg-blue-600 ml-2">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatComponent;
