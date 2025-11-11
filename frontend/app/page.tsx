'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import FieldConfig from '@/components/FieldConfig';
import ResultsEditor from '@/components/ResultsEditor';
import { getAllConfigurations } from '@/lib/db';

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => <div className="text-black text-center p-8">Loading PDF viewer...</div>,
});

interface FieldDefinition {
  name: string;
  description: string;
  type: string;
}

interface PDFResult {
  file: File;
  url: string;
  parsedText: string;
  extractedData: Record<string, any>;
  originalExtractedData?: Record<string, any>;
  error?: string;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  parseStartTime?: number;
  parseEndTime?: number;
  parseDuration?: number;
}

export default function Home() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [results, setResults] = useState<PDFResult[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([
    { name: 'start date', description: 'Start date of reporting period', type: 'string' },
    { name: 'end date', description: 'End date of reporting period', type: 'string' },
    { name: 'total', description: 'Total volume', type: 'number' },
    { name: 'recycle', description: 'Total volume of all recycling entries', type: 'number' },
    { name: 'compost', description: 'Total volume of all compost entries', type: 'number' },
    { name: 'trash', description: 'Total volume of all trash entries', type: 'number' },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [processingAll, setProcessingAll] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [currentConfigName, setCurrentConfigName] = useState<string>('Default');
  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState<number>(1.0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  // Auto-load most recently used configuration on mount
  useEffect(() => {
    const loadMostRecentConfig = async () => {
      try {
        const configs = await getAllConfigurations();
        if (configs.length > 0) {
          // Sort by lastUsedAt descending (most recently used first)
          // If no lastUsedAt, fall back to updatedAt
          const sortedConfigs = configs.sort((a, b) => {
            const aTime = a.lastUsedAt || a.updatedAt;
            const bTime = b.lastUsedAt || b.updatedAt;
            return bTime - aTime;
          });
          // Load the most recently used configuration
          setFields(sortedConfigs[0].fields);
          setCurrentConfigName(sortedConfigs[0].name);
        }
      } catch (error) {
        console.error('Failed to load saved configurations:', error);
      }
    };

    loadMostRecentConfig();
  }, []);

  const addFiles = (files: File[]) => {
    const validPdfs = files.filter(file => file.type === 'application/pdf');

    if (validPdfs.length > 0) {
      setPdfFiles(prev => [...prev, ...validPdfs]);
      // Auto-select the first new file if nothing is selected
      if (selectedFileIndex === null) {
        setSelectedFileIndex(pdfFiles.length);
      }
      // Add new results entries
      setResults(prev => [
        ...prev,
        ...validPdfs.map(file => ({
          file,
          url: URL.createObjectURL(file),
          parsedText: '',
          extractedData: {},
          status: 'pending' as const,
        }))
      ]);
      setError('');
    } else {
      setError('Please select valid PDF files');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const processSingleFile = async (fileIndex: number) => {
    const currentFile = pdfFiles[fileIndex];
    const startTime = Date.now();

    // Update status to processing
    setResults(prev => {
      const updated = [...prev];
      updated[fileIndex] = {
        ...updated[fileIndex],
        status: 'processing',
        parseStartTime: startTime,
      };
      return updated;
    });

    try {
      // Step 1: Parse PDF to text
      const formData = new FormData();
      formData.append('file', currentFile);

      const parseResponse = await fetch('http://localhost:5000/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse PDF');
      }

      const parseData = await parseResponse.json();
      const text = parseData.text || parseData.content || JSON.stringify(parseData);

      // Step 2: Extract structured data
      // Convert fields to JSON schema format
      const schema = {
        type: 'object',
        properties: fields.reduce((acc, field) => {
          acc[field.name] = {
            type: field.type === 'number' ? 'number' : 'string',
            description: field.description,
          };
          return acc;
        }, {} as Record<string, any>),
        required: fields.map(f => f.name),
      };

      const extractResponse = await fetch('http://localhost:5000/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: text,
          schema: schema,
        }),
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to extract data');
      }

      const extractData = await extractResponse.json();

      // Landing AI returns data in the 'extraction' field
      const parsedData = extractData.extraction || extractData.data || extractData.fields || extractData;

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update the result for this file
      setResults(prev => {
        const updated = [...prev];
        updated[fileIndex] = {
          ...updated[fileIndex],
          parsedText: text,
          extractedData: parsedData,
          originalExtractedData: parsedData, // Store original for undo functionality
          status: 'completed',
          error: undefined,
          parseEndTime: endTime,
          parseDuration: duration,
        };
        return updated;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      // Update the result with the error
      setResults(prev => {
        const updated = [...prev];
        updated[fileIndex] = {
          ...updated[fileIndex],
          error: errorMessage,
          status: 'error',
        };
        return updated;
      });

      throw err;
    }
  };

  const handleParse = async () => {
    if (selectedFileIndex === null || !pdfFiles[selectedFileIndex]) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError('');
    setLoadingStep('Uploading PDF...');

    try {
      setLoadingStep('Parsing PDF to text...');
      await processSingleFile(selectedFileIndex);
      setLoadingStep('Complete!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleProcessAll = async () => {
    setProcessingAll(true);
    setError('');

    // Process all files simultaneously
    const promises = pdfFiles.map((_, index) =>
      processSingleFile(index).catch(err => {
        // Error is already handled in processSingleFile
        console.error(`Error processing file ${index}:`, err);
      })
    );

    await Promise.all(promises);

    setProcessingAll(false);
  };

  const handleResetData = () => {
    if (selectedFileIndex === null || !results[selectedFileIndex]) {
      return;
    }

    const result = results[selectedFileIndex];
    if (!result.originalExtractedData) {
      return;
    }

    // Reset to original data
    setResults(prev => {
      const updated = [...prev];
      updated[selectedFileIndex] = {
        ...updated[selectedFileIndex],
        extractedData: { ...result.originalExtractedData },
      };
      return updated;
    });
  };

  const handleExportToCSV = () => {
    // Filter results that have extracted data
    const completedResults = results.filter(
      result => result.status === 'completed' && Object.keys(result.extractedData).length > 0
    );

    if (completedResults.length === 0) {
      setError('No completed extractions to export');
      return;
    }

    // Helper function to escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes(' ')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV headers: filename, file_size, parsed_at, parse_duration_ms, ...field names
    const headers = [
      'filename',
      'file_size_bytes',
      'parsed_at',
      'parse_duration_ms',
      ...fields.map(f => escapeCSV(f.name))
    ];

    // Build CSV rows
    const rows = completedResults.map(result => {
      const row: string[] = [
        escapeCSV(result.file.name),
        result.file.size.toString(),
        result.parseEndTime ? new Date(result.parseEndTime).toISOString() : '',
        result.parseDuration?.toString() || '',
        ...fields.map(field => {
          const value = result.extractedData[field.name];
          // Escape values that contain commas or quotes
          if (value === undefined || value === null) return '';
          const stringValue = String(value);
          return escapeCSV(stringValue);
        })
      ];
      return row.join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pdf_extractions_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PDF Data Extractor</h1>
          <div className="flex gap-3">
            <button
              onClick={handleExportToCSV}
              disabled={results.filter(r => r.status === 'completed').length === 0}
              className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <span>📊</span>
              Export to CSV
            </button>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <span>⚙️</span>
              Configure Fields
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        {pdfFiles.length > 0 && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleParse}
              disabled={selectedFileIndex === null || loading || processingAll}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : `Parse Selected${pdfFiles.length > 0 && selectedFileIndex !== null ? ` (${pdfFiles[selectedFileIndex].name})` : ''}`}
            </button>
            {pdfFiles.length > 1 && (
              <button
                onClick={handleProcessAll}
                disabled={processingAll || loading}
                className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {processingAll ? 'Processing All...' : 'Process All'}
              </button>
            )}
          </div>
        )}

        {/* Field Configuration Popout */}
        <FieldConfig
          fields={fields}
          setFields={setFields}
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          currentConfigName={currentConfigName}
          setCurrentConfigName={setCurrentConfigName}
        />

        {/* Main Content Area */}
        <div className="grid grid-cols-2 gap-6">
          {/* PDF Viewer with File Upload */}
          <div
            className="bg-white rounded-lg shadow p-6"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">PDF Preview</h2>
              <label className="bg-blue-600 text-white py-1 px-3 rounded text-sm cursor-pointer hover:bg-blue-700 transition">
                + Add PDFs
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* File List */}
            {pdfFiles.length > 0 && (
              <div className="border border-gray-300 rounded-lg overflow-hidden mb-4">
                <div className="max-h-32 overflow-y-auto">
                  {pdfFiles.map((file, index) => {
                    const status = results[index]?.status;
                    let statusIcon = '';
                    let statusColor = '';

                    if (status === 'processing') {
                      statusIcon = '⟳';
                      statusColor = 'text-blue-600 animate-spin';
                    } else if (status === 'completed') {
                      statusIcon = '✓';
                      statusColor = 'text-green-600';
                    } else if (status === 'error') {
                      statusIcon = '✗';
                      statusColor = 'text-red-600';
                    } else {
                      statusIcon = '○';
                      statusColor = 'text-gray-400';
                    }

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedFileIndex(index)}
                        className={`px-3 py-2 cursor-pointer border-b border-gray-200 last:border-b-0 flex items-center justify-between ${
                          selectedFileIndex === index ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs text-black truncate flex-1">{file.name}</span>
                        <span className={`text-sm ml-2 ${statusColor}`}>{statusIcon}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PDF Preview or Drop Zone */}
            {selectedFileIndex !== null && results[selectedFileIndex] ? (
              <PDFViewer
                pdfUrl={results[selectedFileIndex].url}
                scale={scale}
                setScale={setScale}
                pageNumber={pageNumber}
                setPageNumber={setPageNumber}
              />
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg flex items-center justify-center min-h-96 transition ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="text-center p-8">
                  <p className="text-black text-lg mb-2">Drop PDF files here</p>
                  <p className="text-gray-600 text-sm">or click &quot;+ Add PDFs&quot; above</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Extracted Data</h2>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                <div className="text-xl font-semibold text-black">{loadingStep}</div>
              </div>
            ) : selectedFileIndex !== null && results[selectedFileIndex] ? (
              <ResultsEditor
                data={results[selectedFileIndex].extractedData}
                setData={(newData) => {
                  setResults(prev => {
                    const updated = [...prev];
                    updated[selectedFileIndex] = {
                      ...updated[selectedFileIndex],
                      extractedData: newData,
                    };
                    return updated;
                  });
                }}
                fields={fields}
                originalData={results[selectedFileIndex].originalExtractedData}
                onReset={handleResetData}
              />
            ) : (
              <div className="text-black text-center py-8">
                No data extracted yet. Upload a PDF and click &quot;Parse & Extract Data&quot; to begin.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
