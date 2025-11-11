'use client';

import { useState, useEffect } from 'react';
import PDFViewer from '@/components/PDFViewer';
import FieldConfig from '@/components/FieldConfig';
import ResultsEditor from '@/components/ResultsEditor';
import { getAllConfigurations } from '@/lib/db';

interface FieldDefinition {
  name: string;
  description: string;
  type: string;
}

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [parsedText, setParsedText] = useState<string>('');
  const [fields, setFields] = useState<FieldDefinition[]>([
    { name: 'invoice_number', description: 'Invoice or receipt number', type: 'string' },
    { name: 'date', description: 'Transaction date', type: 'string' },
    { name: 'total', description: 'Total amount', type: 'number' },
  ]);
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [currentConfigName, setCurrentConfigName] = useState<string>('Default');

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setError('');
      setExtractedData({});
      setParsedText('');
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleParse = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError('');
    setLoadingStep('Uploading PDF...');

    try {
      // Step 1: Parse PDF to text
      const formData = new FormData();
      formData.append('file', pdfFile);

      setLoadingStep('Parsing PDF to text...');
      const parseResponse = await fetch('http://localhost:5000/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse PDF');
      }

      const parseData = await parseResponse.json();
      const text = parseData.text || parseData.content || JSON.stringify(parseData);
      setParsedText(text);

      // Step 2: Extract structured data
      setLoadingStep('Extracting structured data...');

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
      console.log('Extract API Response:', extractData);

      // Landing AI returns data in the 'extraction' field
      const parsedData = extractData.extraction || extractData.data || extractData.fields || extractData;

      console.log('Parsed data to display:', parsedData);
      setExtractedData(parsedData);
      setLoadingStep('Complete!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PDF Data Extractor</h1>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            <span>⚙️</span>
            Configure Fields
          </button>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Upload PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!pdfFile || loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : 'Parse & Extract Data'}
            </button>
          </div>
        </div>

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
          {/* PDF Viewer - Always visible when PDF is uploaded */}
          {pdfUrl ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">PDF Preview</h2>
              <PDFViewer pdfUrl={pdfUrl} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center min-h-96">
              <p className="text-black text-center">Upload a PDF to preview it here</p>
            </div>
          )}

          {/* Results Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Extracted Data</h2>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                <div className="text-xl font-semibold text-black">{loadingStep}</div>
              </div>
            ) : (
              <ResultsEditor
                data={extractedData}
                setData={setExtractedData}
                fields={fields}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
