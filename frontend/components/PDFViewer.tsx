'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  pdfUrl: string;
  scale: number;
  setScale: (scale: number) => void;
  pageNumber: number;
  setPageNumber: (pageNumber: number) => void;
}

export default function PDFViewer({ pdfUrl, scale, setScale, pageNumber, setPageNumber }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError('');
  }

  function onDocumentLoadError(error: Error) {
    setError('Failed to load PDF');
    setLoading(false);
    console.error('PDF load error:', error);
  }

  const zoomIn = () => setScale(Math.min(scale + 0.25, 3.0));
  const zoomOut = () => setScale(Math.max(scale - 0.25, 0.5));
  const resetZoom = () => setScale(1.0);

  return (
    <div className="flex flex-col items-center">
      {loading && <div className="text-black">Loading PDF...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {/* Zoom Controls */}
      {numPages > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-xs text-black min-w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      )}

      <div className="border border-gray-300 rounded overflow-auto mb-4 max-h-[600px] w-full">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="p-8 text-black">Loading...</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      {numPages > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPageNumber(Math.max(pageNumber - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-black">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
