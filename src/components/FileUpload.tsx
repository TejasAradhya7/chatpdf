"use client";
import { uploadToSupabase } from "@/lib/supabase-storage";
import { Inbox, Loader2 } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import ChatComponent from "./ChatComponent";

// TypeScript interfaces for API response and component state
interface UploadResponse {
  chat_id?: number;
  error?: string;
}

const FileUpload: React.FC = () => {
  const router = useRouter();

  // Strict state management for upload logic
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<string>("Extracting and vectorizing document... Please wait.");

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"], "application/x-pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isProcessing, // Prevent duplicate submissions
    onDrop: async (acceptedFiles, fileRejections) => {
      setErrorMessage(null);

      if (fileRejections && fileRejections.length > 0) {
        const error = "Invalid file. Please select a valid PDF under 20MB.";
        setErrorMessage(error);
        toast.error(error);
        return;
      }

      const selectedFile = acceptedFiles[0];
      if (!selectedFile) {
        const error = "No file selected.";
        setErrorMessage(error);
        toast.error(error);
        return;
      }
      if (selectedFile.size > 20 * 1024 * 1024) {
        const error = "File size exceeds 20MB limit.";
        setErrorMessage(error);
        toast.error(error);
        return;
      }

      setFile(selectedFile);

      // Lock state immediately upon submission to prevent duplicate attempts
      setIsProcessing(true);
      setUploadStatus("Uploading PDF file to storage...");
      setUploadProgress(25);

      try {
        const data = await uploadToSupabase(selectedFile);
        console.log("Upload result:", data);

        if (!data?.file_key || !data.file_name) {
          throw new Error("Failed to upload file to storage.");
        }

        setUploadStatus("Extracting and vectorizing document... Please wait.");
        setUploadProgress(75);

        // Send PDF parameters to the backend
        const response = await axios.post<UploadResponse>("/api/create-chat", {
          file_key: data.file_key,
          file_name: data.file_name,
        });

        if (response.data?.chat_id) {
          setUploadProgress(100);
          setUploadStatus("Opening Extraction Studio...");
          toast.success("PDF processed successfully!");

          // Directly navigate to the dedicated chat page
          const chatUrl = `/chat/${response.data.chat_id}`;
          window.location.assign(chatUrl);
        } else {
          throw new Error("Error creating chat session.");
        }
      } catch (error: any) {
        console.error("Upload integration error:", error);
        
        // UNLOCK STATE ON ERROR:
        const msg = error?.response?.data?.error || error?.message || "Failed to process PDF file.";
        setErrorMessage(msg);
        toast.error(msg);
        setIsProcessing(false);
        setUploadProgress(0);
      }
    },
  });

  return (
    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition py-10 flex justify-center items-center flex-col text-center px-4",
        })}
      >
        <input {...getInputProps()} />
        {isProcessing ? (
          <>
            {/* Loading UI Polish */}
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {uploadStatus}
            </p>
            {uploadProgress > 0 && (
              <div className="w-full max-w-xs bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Please wait while your document is being prepared...</p>
          </>
        ) : (
          <>
            <Inbox className="w-12 h-12 text-blue-600 mb-1" />
            <p className="mt-2 text-base text-slate-700 font-bold">Drop PDF File Here</p>
            <p className="text-xs text-slate-500 mt-1">Click to browse or drag & drop (Up to 20 MB)</p>
            {errorMessage && (
              <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-md border border-red-200">
                ⚠️ {errorMessage}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
