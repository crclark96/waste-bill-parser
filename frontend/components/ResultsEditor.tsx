'use client';

import { useState } from 'react';

interface FieldDefinition {
  name: string;
  description: string;
  type: string;
}

interface ResultsEditorProps {
  data: Record<string, any>;
  setData: (data: Record<string, any>) => void;
  fields: FieldDefinition[];
}

export default function ResultsEditor({ data, setData, fields }: ResultsEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleFieldChange = (fieldName: string, value: any) => {
    setData({
      ...data,
      [fieldName]: value,
    });
  };

  const handleCopyToClipboard = async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (Object.keys(data).length === 0) {
    return (
      <div className="text-black text-center py-8">
        No data extracted yet. Upload a PDF and click &quot;Parse & Extract Data&quot; to begin.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label className="block text-sm font-medium text-black">
            {field.name}
            <span className="text-black text-xs ml-2">({field.description})</span>
          </label>
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={data[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${field.name}`}
          />
        </div>
      ))}

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleCopyToClipboard}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-black mb-2">JSON Preview</h3>
        <pre className="text-xs text-black bg-white p-3 rounded border border-gray-200 overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
