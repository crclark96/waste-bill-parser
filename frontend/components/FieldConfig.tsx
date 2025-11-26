'use client';

import { useState, useEffect, useRef } from 'react';
import {
  saveConfiguration,
  getAllConfigurations,
  getConfigurationByName,
  deleteConfiguration,
  markConfigurationAsUsed,
  FieldConfiguration,
} from '@/lib/db';
import { getCookie, setCookie } from '@/lib/utils';

interface FieldDefinition {
  name: string;
  description: string;
  type: string;
}

interface FieldConfigProps {
  fields: FieldDefinition[];
  setFields: (fields: FieldDefinition[]) => void;
  isOpen: boolean;
  onClose: () => void;
  currentConfigName: string;
  setCurrentConfigName: (name: string) => void;
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export default function FieldConfig({ fields, setFields, isOpen, onClose, currentConfigName, setCurrentConfigName, apiKey, onApiKeyChange }: FieldConfigProps) {
  const [newField, setNewField] = useState<FieldDefinition>({
    name: '',
    description: '',
    type: 'string',
  });
  const [configName, setConfigName] = useState('');
  const [savedConfigs, setSavedConfigs] = useState<FieldConfiguration[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfigurations();
    // Load API key from cookie on mount
    const savedKey = getCookie('landing_ai_api_key');
    if (savedKey) {
      setLocalApiKey(savedKey);
    }
  }, []);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSaveApiKey = () => {
    if (localApiKey.trim()) {
      setCookie('landing_ai_api_key', localApiKey.trim());
      onApiKeyChange(localApiKey.trim());
    }
  };

  const handleClearApiKey = () => {
    setLocalApiKey('');
    setCookie('landing_ai_api_key', '', -1); // Delete cookie
    onApiKeyChange('');
  };

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add a small delay to avoid closing immediately when opening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadConfigurations = async () => {
    const configs = await getAllConfigurations();
    setSavedConfigs(configs);
  };

  const handleAddField = () => {
    if (newField.name && newField.description) {
      setFields([...fields, newField]);
      setNewField({ name: '', description: '', type: 'string' });
    }
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleDuplicateField = (index: number) => {
    const fieldToDuplicate = fields[index];
    const duplicatedField = {
      ...fieldToDuplicate,
      name: `${fieldToDuplicate.name}_copy`,
    };
    setFields([...fields, duplicatedField]);
  };

  const handleUpdateField = (index: number, updatedField: FieldDefinition) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  const handleSaveConfig = async () => {
    if (!configName.trim()) {
      alert('Please enter a configuration name');
      return;
    }

    try {
      await saveConfiguration({
        name: configName,
        fields,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await loadConfigurations();
      setShowSaveDialog(false);
      setConfigName('');
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    }
  };

  const handleLoadConfig = async (config: FieldConfiguration) => {
    setFields(config.fields);
    setCurrentConfigName(config.name);
    setShowLoadDialog(false);

    // Mark this config as recently used
    if (config.id) {
      await markConfigurationAsUsed(config.id);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (confirm('Are you sure you want to delete this configuration?')) {
      await deleteConfiguration(id);
      await loadConfigurations();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Side Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto border-l-2 border-gray-300"
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-black">Waste Streams</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Current: <span className="font-semibold text-black">{currentConfigName}</span>
            </div>
          </div>

          {/* API Key Section */}
          <div className="mb-6 p-4 border border-gray-300 rounded bg-blue-50">
            <h3 className="text-sm font-semibold text-black mb-3">Landing AI API Key</h3>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={isApiKeyVisible ? 'text' : 'password'}
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="Enter your Landing AI API key"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black pr-16"
                />
                <button
                  onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700"
                >
                  {isApiKeyVisible ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveApiKey}
                  disabled={!localApiKey.trim()}
                  className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Save Key
                </button>
                <button
                  onClick={handleClearApiKey}
                  className="flex-1 bg-red-500 text-white py-1.5 px-3 rounded text-sm hover:bg-red-600"
                >
                  Clear Key
                </button>
              </div>
              <p className="text-xs text-gray-700">
                Your API key is stored securely in a browser cookie and never sent to any server except Landing AI.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm"
            >
              Save Config
            </button>
            <button
              onClick={() => setShowLoadDialog(true)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
            >
              Load Config
            </button>
          </div>

          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50">
              <h3 className="text-sm font-semibold text-black mb-2">Save Configuration</h3>
              <input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Configuration name"
                className="w-full px-3 py-2 text-black border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setConfigName('');
                  }}
                  className="flex-1 bg-gray-400 text-white py-1 px-3 rounded hover:bg-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Load Dialog */}
          {showLoadDialog && (
            <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-semibold text-black mb-2">Load Configuration</h3>
              {savedConfigs.length === 0 ? (
                <p className="text-sm text-black">No saved configurations</p>
              ) : (
                <div className="space-y-2">
                  {savedConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                    >
                      <button
                        onClick={() => handleLoadConfig(config)}
                        className="flex-1 text-left text-sm text-black hover:text-blue-600"
                      >
                        {config.name}
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.id!)}
                        className="ml-2 text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowLoadDialog(false)}
                className="w-full mt-3 bg-gray-400 text-white py-1 px-3 rounded hover:bg-gray-500 text-sm"
              >
                Close
              </button>
            </div>
          )}

          <div className="text-sm text-black mb-4">
            Configure which fields to extract from the PDF. The LLM will attempt to find these
            fields in the parsed text.
          </div>

          {/* Existing Fields */}
          <div className="space-y-3 mb-6">
            {fields.map((field, index) => (
              <div key={index} className="border border-gray-200 p-3 rounded bg-gray-50">
                <div className="space-y-2">
                  <div>
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
                  <div>
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
                  <div>
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
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleDuplicateField(index)}
                      className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleRemoveField(index)}
                      className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Field */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-black mb-3">Add New Field</h3>
            <div className="space-y-2">
              <div>
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
              <div>
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
              <div>
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
              <button
                onClick={handleAddField}
                disabled={!newField.name || !newField.description}
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
