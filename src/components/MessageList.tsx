import { cn } from "@/lib/utils";
import { Message } from "ai/react";
import { Loader2, Bot, User } from "lucide-react";
import React from "react";

type Props = {
  isLoading: boolean;
  messages: Message[];
};

const FormattedText: React.FC<{ content: string }> = ({ content }) => {
  // Split into lines for structured block rendering
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1" />;

        // Header 1 / 2 / 3
        if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          const headerText = trimmed.replace(/^#+\s*/, "");
          return (
            <h4 key={index} className="font-bold text-slate-900 text-sm mt-3 mb-1 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <span>{headerText}</span>
            </h4>
          );
        }

        // Bullet point item
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const bulletText = trimmed.replace(/^[\*\-]\s*/, "");
          return (
            <div key={index} className="flex items-start gap-2 ml-2 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
              <div className="flex-1">
                {renderInlineFormatting(bulletText)}
              </div>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={index} className="my-1">
            {renderInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
};

function renderInlineFormatting(text: string) {
  // Split by bold (**text**) and page citations ([Page X])
  const parts = text.split(/(\*\*[^*]+\*\*|\[Page\s+\d+\])/gi);

  return parts.map((part, i) => {
    if (!part) return null;

    // Bold text
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Page Citation Pill Badge
    if (/\[Page\s+\d+\]/i.test(part)) {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-semibold text-[11px] px-2 py-0.5 rounded-md mx-1 border border-blue-200 shadow-2xs"
        >
          🏷️ {part.replace(/[\[\]]/g, "")}
        </span>
      );
    }

    return <span key={i}>{part}</span>;
  });
}

const MessageList = ({ messages, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 text-slate-500 gap-2 text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Thinking & analyzing document context...</span>
      </div>
    );
  }

  if (!messages || messages.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 overflow-y-auto">
      {messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <div
            key={message.id}
            className={cn("flex gap-3 max-w-[92%]", {
              "ml-auto flex-row-reverse": isUser,
              "mr-auto": !isUser,
            })}
          >
            {/* Avatar Icon */}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs",
                {
                  "bg-blue-600 text-white": isUser,
                  "bg-slate-900 text-blue-400 border border-slate-700": !isUser,
                }
              )}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble Container */}
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm shadow-xs transition-all",
                {
                  "bg-blue-600 text-white rounded-tr-none": isUser,
                  "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm": !isUser,
                }
              )}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap text-white text-sm">{message.content}</p>
              ) : (
                <FormattedText content={message.content} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
