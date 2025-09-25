/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { nodeFormFields } from '../../data/nodeTypes';
import { NodeFormField } from '../../types';
import { Eye, EyeOff } from 'lucide-react';

interface NodeFormProps {
  nodeType: string;
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  onOpenCodeEditor?: (fieldName: string) => void;
  previousNodeOutput?: any;
  multipleInputs?: boolean;
}

const operatorOptions = [
  "exists",
  "does not exist",
  "is empty",
  "is not empty",
  "is equal to",
  "is not equal to",
  "contains",
  "does not contain",
  "starts with",
  "does not start with",
  "ends with",
  "does not end with",
];

export const NodeForm: React.FC<NodeFormProps> = ({
  nodeType,
  data,
  onChange,
  onOpenCodeEditor,
  previousNodeOutput,
  multipleInputs = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(data);
  const fields = nodeFormFields[nodeType] || [];

  const inputKeys: string[] = useMemo(() => {
    if (!previousNodeOutput) return [];

    if (multipleInputs) {
      if (Array.isArray(previousNodeOutput)) {
        return previousNodeOutput.map((_: any, idx: number) => `input_${idx + 1}`);
      }
      return ['input_1', 'input_2'];
    } else {
      return ['input'];
    }
  }, [previousNodeOutput, multipleInputs]);

  const numericFeatures = useMemo(() => {
    let jsonData: any[] = [];

    try {
      if (formData.jsonData) {
        jsonData = JSON.parse(formData.jsonData);
      } else if (previousNodeOutput) {
        if (Array.isArray(previousNodeOutput)) {
          jsonData = previousNodeOutput;
        } else if (typeof previousNodeOutput === 'string') {
          jsonData = JSON.parse(previousNodeOutput);
        }
      }
    } catch {
      jsonData = [];
    }

    if (!Array.isArray(jsonData) || jsonData.length === 0) return [];

    const firstItem = jsonData[0];
    return Object.keys(firstItem).filter((key) => {
      const val = firstItem[key];
      return (
        typeof val === 'number' ||
        (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '')
      );
    });
  }, [formData.jsonData, previousNodeOutput]);

  const dependentFeatureOptions = useMemo(() => {
    return numericFeatures.map((feature) => ({
      value: feature,
      label: feature,
    }));
  }, [numericFeatures]);

  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData(data);
  }, [data, nodeType]);

  const handleFieldChange = (field: NodeFormField, value: any) => {
    const updates = { ...formData, [field.name]: value };
    setFormData(updates);
    onChange(updates);
  };

  const toggleVisibility = (fieldName: string) => {
    setVisibleFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleFilterChange = (index: number, key: string, value: any) => {
    const filters = [...(formData.filters || [])];
    filters[index] = { ...filters[index], [key]: value };
    handleFieldChange({ name: "filters" } as NodeFormField, filters);
  };

  const addFilter = () => {
    const filters = [...(formData.filters || [])];
    filters.push({ field: inputKeys[0] || "", operator: "exists", value: "" });
    handleFieldChange({ name: "filters" } as NodeFormField, filters);
  };

  const removeFilter = (index: number) => {
    const filters = [...(formData.filters || [])];
    filters.splice(index, 1);
    handleFieldChange({ name: "filters" } as NodeFormField, filters);
  };

  const renderFiltersArray = () => {
    const filters = formData.filters || [];
    return (
      <div>
        {filters.map((filter: any, index: number) => (
          <div key={index} className="flex flex-col gap-2 mb-6 p-3 border rounded">
            {/* Field select */}
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Field</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 appearance-none bg-[url('data:image/svg+xml;utf8,<svg fill=\'%23666\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>')] bg-no-repeat bg-right-2 bg-center"
              value={filter.field}
              onChange={(e) => handleFilterChange(index, "field", e.target.value)}
            >
              {inputKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Operator</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 appearance-none bg-[url('data:image/svg+xml;utf8,<svg fill=\'%23666\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>')] bg-no-repeat bg-right-2 bg-center"
              value={filter.operator}
              onChange={(e) => handleFilterChange(index, "operator", e.target.value)}
            >
              {operatorOptions.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
              value={filter.value}
              onChange={(e) => handleFilterChange(index, "value", e.target.value)}
              placeholder="Value"
            />

            <button
              type="button"
              onClick={() => removeFilter(index)}
              className="self-start text-red-600 hover:text-red-800 mt-1"
              aria-label="Remove filter"
            >
              &times; Remove Filter
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addFilter}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Filter
        </button>
      </div>
    );
  };

  const selectedFeatures: string[] = formData.selectedFeatures || [];

  const availableFeatures = numericFeatures.filter(
    (f) => !selectedFeatures.includes(f)
  );

  const addFeature = (feature: string) => {
    if (!selectedFeatures.includes(feature)) {
      const updated = [...selectedFeatures, feature];
      updateSelectedFeatures(updated);
    }
  };

  const removeFeature = (feature: string) => {
    const updated = selectedFeatures.filter((f) => f !== feature);
    updateSelectedFeatures(updated);
  };

  const updateSelectedFeatures = (features: string[]) => {
    const updates = { ...formData, selectedFeatures: features };
    setFormData(updates);
    onChange(updates);
  };

  const renderField = (field: NodeFormField) => {
    if ((nodeType === 'linearRegressionNode' || nodeType === 'logisticRegressionNode') && field.name === 'dependentFeature') {
      return (
        <select
          value={formData.dependentFeature || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className={`
            w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-150
          `}
          required={field.required}
        >
          <option value="" disabled>
            Select dependent feature
          </option>
          {dependentFeatureOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "filtersArray") {
      return renderFiltersArray();
    }

    if (field.type === "featureSelector") {
      return (
        <div>
          <div className="mb-2">
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  addFeature(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>
                Select feature to add
              </option>
              {availableFeatures.map((feature) => (
                <option key={feature} value={feature}>
                  {feature}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFeatures.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No features selected yet.
              </p>
            )}
            {selectedFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-1 bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded px-2 py-1"
              >
                <span>{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(feature)}
                  className="text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-bold"
                  aria-label={`Remove feature ${feature}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === "fileUpload") {
      const acceptTypes = field.name === "csvText" ? ".csv,text/csv" : ".json,application/json";
      return (
        <div>
          <input
            type="file"
            accept={acceptTypes}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  const text = reader.result as string;
                  onChange({ ...formData, [field.name]: text });
                  setFormData({ ...formData, [field.name]: text });
                };
                reader.readAsText(file);
              }
            }}
          />
          {formData[field.name] && (
            <pre className="mt-2 max-h-40 overflow-auto bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap text-black">
              {formData[field.name].substring(0, 500)}{formData[field.name].length > 500 ? "..." : ""}
            </pre>
          )}
        </div>
      );
    }

    if (field.type === "imageUpload") {
      const imageSrc = formData[field.name] || "";
      return (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  handleFieldChange(field, reader.result);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          {imageSrc && (
            <img
              src={imageSrc}
              alt="Uploaded"
              className="mt-2 max-w-full max-h-48 rounded border"
            />
          )}
        </div>
      );
    }

    const value = formData[field.name] || '';

    const baseInputClasses = `
      w-full px-3 py-2 border border-gray-300 dark:border-gray-600
      rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      transition-colors duration-150
    `;

    switch (field.type) {
      case 'text':
      case 'url':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseInputClasses} resize-vertical`}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={baseInputClasses}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {field.label}
            </span>
          </label>
        );

      case 'confidential': {
          const isVisible = visibleFields[field.name] || false;
          return (
            <div className="relative">
              <input
                type={isVisible ? 'text' : 'password'}
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                placeholder={field.placeholder}
                className={`${baseInputClasses} pr-10`}
                required={field.required}
              />
              <button
                type="button"
                onClick={() => toggleVisibility(field.name)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={isVisible ? 'Hide confidential input' : 'Show confidential input'}
              >
                {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          );
        }

      case 'codeButton': 
        return (
          <button
            type="button"
            onClick={() => onOpenCodeEditor && onOpenCodeEditor(field.name)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Open Code Editor
          </button>
        );

      default:
        return null;
    }
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No configuration needed for this node type.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {field.validation && formData[field.name] && (
            <div className="mt-1">
              {(() => {
                const error = field.validation(formData[field.name]);
                return error ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : null;
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};