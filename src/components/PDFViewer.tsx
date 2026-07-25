import React from "react";

type Props = { pdf_url: string };

const PDFViewer = ({ pdf_url }: Props) => {
  // If pdf_url is a local path or localhost URL, use native browser PDF rendering directly
  const isLocal = pdf_url.startsWith("/") || pdf_url.includes("localhost") || pdf_url.includes("127.0.0.1");
  const viewerUrl = isLocal
    ? pdf_url
    : `https://docs.google.com/gview?url=${encodeURIComponent(pdf_url)}&embedded=true`;

  return (
    <iframe
      src={viewerUrl}
      className="w-full h-full rounded-xl border-0"
      title="PDF Viewer"
    ></iframe>
  );
};

export default PDFViewer;
