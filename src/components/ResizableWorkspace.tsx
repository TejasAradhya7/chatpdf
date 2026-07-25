"use client";

import React from "react";
import { GripVertical, ChevronLeft, ChevronRight, LayoutGrid, Maximize2 } from "lucide-react";

interface Props {
  sidebar: React.ReactNode;
  pdfViewer: React.ReactNode;
  chatStudio: React.ReactNode;
}

export default function ResizableWorkspace({ sidebar, pdfViewer, chatStudio }: Props) {
  // Column Width States (in pixels)
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(240);
  const [chatWidth, setChatWidth] = React.useState<number>(500);

  // Active Dragging State (prevents iframe from stealing mouse focus)
  const [isDragging, setIsDragging] = React.useState<"sidebar" | "chat" | null>(null);
  
  // Collapse Toggles
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(false);
  const [isChatCollapsed, setIsChatCollapsed] = React.useState<boolean>(false);

  // Mouse Down Event Handlers
  const startResizingSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging("sidebar");
  };

  const startResizingChat = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging("chat");
  };

  // Mouse Move Event Listener
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      if (isDragging === "sidebar") {
        const newWidth = Math.max(140, Math.min(500, e.clientX));
        setSidebarWidth(newWidth);
      } else if (isDragging === "chat") {
        const newWidth = Math.max(300, Math.min(900, window.innerWidth - e.clientX));
        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-1 w-full h-full overflow-hidden select-none relative bg-slate-950">
      {/* FULLSCREEN DRAG OVERLAY: Prevents PDF Iframe from hijacking mouse focus while resizing */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize bg-black/10 select-none" />
      )}

      {/* 1. LEFT PANEL: Sidebar */}
      <div
        style={{ width: isSidebarCollapsed ? "0px" : `${sidebarWidth}px` }}
        className="bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden relative"
      >
        {!isSidebarCollapsed && sidebar}
      </div>

      {/* DRAG HANDLE 1: Resize Sidebar (Clearly Visible Highlight) */}
      <div
        onMouseDown={startResizingSidebar}
        className={`w-3 bg-slate-900 hover:bg-blue-600 border-x border-slate-800/80 cursor-col-resize flex items-center justify-center text-slate-500 hover:text-white transition-colors shrink-0 z-30 ${
          isDragging === "sidebar" ? "bg-blue-600 text-white w-3" : ""
        }`}
        title="Drag left/right to resize Sidebar width"
      >
        <GripVertical className="w-3 h-3" />
      </div>

      {/* 2. CENTER PANEL: PDF Document Preview */}
      <div className="flex-1 h-full bg-slate-900 p-2 overflow-hidden flex flex-col relative min-w-[250px]">
        {/* Top Quick Control Bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-slate-950 border border-slate-800 rounded-t-xl text-slate-400 text-xs shrink-0 mb-1">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center gap-1 hover:text-white px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-blue-400" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            <span>{isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}</span>
          </button>

          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-blue-400" /> PDF Document Preview
          </span>

          <button
            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
            className="flex items-center gap-1 hover:text-white px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <span>{isChatCollapsed ? "Show AI Chat Studio" : "Hide AI Chat Studio"}</span>
            {isChatCollapsed ? <ChevronLeft className="w-3.5 h-3.5 text-blue-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* PDF Container (pointer-events-none during drag so mouse doesn't get trapped) */}
        <div
          className={`flex-1 bg-slate-800 rounded-b-xl overflow-hidden border border-slate-700 shadow-inner ${
            isDragging ? "pointer-events-none" : ""
          }`}
        >
          {pdfViewer}
        </div>
      </div>

      {/* DRAG HANDLE 2: Resize Chat & Extraction Studio (Clearly Visible Highlight) */}
      <div
        onMouseDown={startResizingChat}
        className={`w-3 bg-slate-900 hover:bg-blue-600 border-x border-slate-800/80 cursor-col-resize flex items-center justify-center text-slate-500 hover:text-white transition-colors shrink-0 z-30 ${
          isDragging === "chat" ? "bg-blue-600 text-white w-3" : ""
        }`}
        title="Drag left/right to resize AI Chat Studio width"
      >
        <GripVertical className="w-3 h-3" />
      </div>

      {/* 3. RIGHT PANEL: AI Question & RAG Data Extraction Studio */}
      <div
        style={{ width: isChatCollapsed ? "0px" : `${chatWidth}px` }}
        className="bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden shadow-xl relative"
      >
        {!isChatCollapsed && chatStudio}
      </div>
    </div>
  );
}
