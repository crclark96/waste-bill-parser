'use client';

import { useState, useEffect } from 'react';

interface FieldDefinition {
  name: string;
  description: string;
  type: string;
}

interface ResultsEditorProps {
  data: Record<string, any>;
  setData: (data: Record<string, any>) => void;
  fields: FieldDefinition[];
  originalData?: Record<string, any>;
  onReset?: () => void;
}

export default function ResultsEditor({ data, setData, fields, originalData, onReset }: ResultsEditorProps) {
  const [copied, setCopied] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  // Check if data has been modified
  const isModified = originalData && JSON.stringify(data) !== JSON.stringify(originalData);

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
      <div className="text-brand-gray text-center py-8">
        No data extracted yet. Upload a PDF and click &quot;Parse & Extract Data&quot; to begin.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Editable Table */}
      <div className="border border-brand-lighter-gray rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-lightest-gray">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy border-b border-brand-lighter-gray w-2/5">
                Field
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy border-b border-brand-lighter-gray w-3/5">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-lighter-gray">
            {fields.map((field, index) => (
              <tr key={field.name} className="hover:bg-brand-lightest-gray">
                <td className="px-4 py-3 text-sm font-medium text-brand-dark-gray border-r border-brand-lighter-gray">
                  <div>
                    <div className="font-semibold">{field.name}</div>
                    <div className="text-xs text-brand-gray">{field.description}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingCell === field.name ? (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={data[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingCell(null);
                        }
                      }}
                      autoFocus
                      className="w-full px-2 py-1 text-sm text-brand-dark-gray border border-brand-light-blue rounded focus:outline-none focus:ring-2 focus:ring-brand-light-blue"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingCell(field.name)}
                      className="cursor-text text-sm text-brand-dark-gray min-h-6 px-2 py-1 hover:bg-brand-lightest-gray rounded"
                    >
                      {data[field.name] || <span className="text-brand-gray italic">Click to edit</span>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyToClipboard}
          className="flex-1 bg-brand-blue text-white py-2 px-4 rounded-lg hover:opacity-90 transition"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        {onReset && (
          <button
            onClick={onReset}
            disabled={!isModified}
            className="bg-brand-orange text-white py-2 px-4 rounded-lg hover:opacity-90 disabled:bg-brand-light-gray disabled:cursor-not-allowed transition"
            title="Reset to original extracted values"
          >
            Reset
          </button>
        )}
      </div>

      {/* JSON Preview (Collapsible) */}
      <details className="bg-brand-lightest-gray p-4 rounded-lg">
        <summary className="text-sm font-semibold text-brand-navy cursor-pointer">
          JSON Preview
        </summary>
        <pre className="text-xs text-brand-dark-gray bg-white p-3 rounded border border-brand-lighter-gray overflow-x-auto mt-2">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
