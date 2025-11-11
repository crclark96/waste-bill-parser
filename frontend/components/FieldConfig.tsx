'use client';

import { useState } from 'react';

interface FieldDefinition {
  name: string;
  description: string;
  type: string;
}

interface FieldConfigProps {
  fields: FieldDefinition[];
  setFields: (fields: FieldDefinition[]) => void;
}

export default function FieldConfig({ fields, setFields }: FieldConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newField, setNewField] = useState<FieldDefinition>({
    name: '',
    description: '',
    type: 'string',
  });

  const handleAddField = () => {
    if (newField.name && newField.description) {
      setFields([...fields, newField]);
      setNewField({ name: '', description: '', type: 'string' });
    }
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, updatedField: FieldDefinition) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-xl font-semibold">Field Configuration</h2>
        <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="text-sm text-black mb-4">
            Configure which fields to extract from the PDF. The AI will attempt to find these
            fields in the parsed text.
          </div>

          {/* Existing Fields */}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-black mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) =>
                      handleUpdateField(index, { ...field, name: e.target.value })
                    }
                    className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-black mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={field.description}
                    onChange={(e) =>
                      handleUpdateField(index, { ...field, description: e.target.value })
                    }
                    className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-black mb-1">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      handleUpdateField(index, { ...field, type: e.target.value })
                    }
                    className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => handleRemoveField(index)}
                    className="w-full px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Field */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-black mb-3">Add New Field</h3>
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-black mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., customer_name"
                />
              </div>
              <div className="col-span-5">
                <label className="block text-xs font-medium text-black mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newField.description}
                  onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                  className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Name of the customer"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-medium text-black mb-1">Type</label>
                <select
                  value={newField.type}
                  onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                  className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
              <div className="col-span-1">
                <button
                  onClick={handleAddField}
                  disabled={!newField.name || !newField.description}
                  className="w-full px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
