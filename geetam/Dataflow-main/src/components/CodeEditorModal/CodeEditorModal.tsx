import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from './Modal';
import Editor, { OnMount, useMonaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import toast from 'react-hot-toast';
import { useWorkflowStore } from '../../store/workflowStore';

interface CodeEditorModalProps {
  isOpen: boolean;
  nodeId: string;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InputDocs: React.FC<{ inputData: any }> = ({ inputData }) => {
  return (
    <div className="p-4 overflow-y-auto h-full text-sm text-gray-700 dark:text-gray-300">
      <h2 className="text-lg font-semibold mb-2">$input Variable Documentation</h2>
      <p>
        <strong>$input</strong> contains the data passed from the previous node in the workflow.
      </p>
      <h3 className="mt-4 font-medium">Data Structure</h3>
      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-40 overflow-auto text-xs font-mono">
        {JSON.stringify(inputData, null, 2)}
      </pre>
      <h3 className="mt-4 font-medium">Type</h3>
      <p>{Array.isArray(inputData) ? 'Array' : typeof inputData}</p>
      <h3 className="mt-4 font-medium">Common Methods</h3>
      {Array.isArray(inputData) ? (
        <ul className="list-disc list-inside">
          <li><code>map(fn)</code> - Transform each item</li>
          <li><code>filter(fn)</code> - Filter items</li>
          <li><code>reduce(fn, initial)</code> - Aggregate values</li>
          <li><code>forEach(fn)</code> - Iterate over items</li>
        </ul>
      ) : typeof inputData === 'object' && inputData !== null ? (
        <ul className="list-disc list-inside">
          <li><code>Object.keys($input)</code> - Get keys</li>
          <li><code>Object.values($input)</code> - Get values</li>
          <li><code>Object.entries($input)</code> - Get key-value pairs</li>
        </ul>
      ) : (
        <p>Primitive type, use directly.</p>
      )}
      <h3 className="mt-4 font-medium">Usage Tips</h3>
      <ul className="list-disc list-inside">
        <li>Always use <code>return</code> to output a value.</li>
        <li>Do not modify <code>$input</code> directly; treat it as read-only.</li>
        <li>Use JavaScript ES6+ syntax for cleaner code.</li>
      </ul>
      <h3 className="mt-4 font-medium">Example</h3>
      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
        {`// Return filtered array
          return $input.filter(item => item.active);

          // Return transformed object
          return { ...$input, newField: 123 };`
        }
      </pre>
    </div>
  );
};

export const CodeEditorModal: React.FC<CodeEditorModalProps> = ({
  isOpen,
  nodeId,
  onClose,
}) => {
  const getNode = useWorkflowStore((state) =>
    state.nodes.find((n) => n.id === nodeId)
  );
  const getNodeInput = useWorkflowStore((state) => state.getNodeInput);
  const updateNode = useWorkflowStore((state) => state.updateNode);

  const inputData = getNodeInput(nodeId) ?? null;
  const initialCode = getNode?.data?.code ?? '';

  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();

  const inputDeclaration = `const $input = ${JSON.stringify(inputData)};`;
  const lockedLinesText = `${inputDeclaration}\n`;

  useEffect(() => {
    if (isOpen) {
      setCode(lockedLinesText + (initialCode || ''));
      setErrors([]);
    }
  }, [isOpen, initialCode, lockedLinesText]);

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('customTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1e1e2f',
          'editorLineNumber.foreground': '#858585',
          'editorLineNumber.activeForeground': '#c6c6c6',
          'editorGutter.background': '#1e1e2f',
          'editorIndentGuide.background': '#404040',
          'editorIndentGuide.activeBackground': '#707070',
          'editorCursor.foreground': '#ffffff',
          'editor.selectionBackground': '#264f78',
          'editor.selectionHighlightBackground': '#add6ff26',
          'editor.wordHighlightBackground': '#575757b8',
          'editor.wordHighlightStrongBackground': '#004972b8',
          'editor.findMatchBackground': '#515c6a',
          'editor.findMatchHighlightBackground': '#ea5c0055',
          'editor.hoverHighlightBackground': '#264f782b',
          'editor.lineHighlightBackground': '#2a2d2e',
          'editorBracketMatch.background': '#515c6a',
          'editorBracketMatch.border': '#a0a0a0',
        },
      });
      monaco.editor.setTheme('customTheme');
    }
  }, [monaco]);

  const validateCode = useCallback(
    (codeToValidate: string) => {
      const errorsFound: string[] = [];

      const codeLines = codeToValidate.split('\n');
      const firstLine = codeLines[0]?.trim() ?? '';

      if (firstLine !== inputDeclaration) {
        errorsFound.push('The $input declaration line must not be removed or modified.');
      }

      const userCodeLines = codeLines.slice(2);
      const userCode = userCodeLines.join('\n');

      if (!/return\s+/.test(userCode)) {
        errorsFound.push('Your code must include a return statement.');
      }

      try {
        new Function(userCode);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        errorsFound.push(`Syntax error: ${e.message}`);
      }

      setErrors(errorsFound);
      return errorsFound.length === 0;
    },
    [inputDeclaration]
  );

  const handleEditorMount: OnMount = useCallback(
    (editor, monacoInstance) => {
      editorRef.current = editor;

      editor.deltaDecorations([], [
        {
          range: new monacoInstance.Range(1, 1, 1, 1000),
          options: {
            isWholeLine: true,
            className: 'locked-line-background',
            glyphMarginClassName: '',
            hoverMessage: { value: 'This line is locked and cannot be edited.' },
          },
        },
        {
          range: new monacoInstance.Range(2, 1, 2, 1000),
          options: {
            isWholeLine: true,
            className: 'locked-line-background',
            glyphMarginClassName: '',
            hoverMessage: { value: 'This line is locked and cannot be edited.' },
          },
        },
      ]);

      editor.onDidChangeModelContent((e) => {
        const model = editor.getModel();
        if (!model) return;

        const editsOnLockedLines = e.changes.some((change) => {
          const startLine = change.range.startLineNumber;
          const endLine = change.range.endLineNumber;
          return startLine === 1 || startLine === 2 || endLine === 1 || endLine === 2;
        });

        if (editsOnLockedLines) {
          const line1Text = model.getLineContent(1);
          const line2Text = model.getLineContent(2);

          const edits = [];

          if (line1Text !== inputDeclaration) {
            edits.push({
              range: new monacoInstance.Range(1, 1, 1, line1Text.length + 1),
              text: inputDeclaration,
            });
          }
          if (line2Text !== '') {
            edits.push({
              range: new monacoInstance.Range(2, 1, 2, line2Text.length + 1),
              text: '',
            });
          }

          if (edits.length > 0) {
            model.pushEditOperations([], edits, () => null);
          }
        }
      });
    },
    [inputDeclaration]
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        setCode(value);
        validateCode(value);
      }
    },
    [validateCode]
  );

  const handleSave = useCallback(() => {
    const codeLines = code.split('\n');
    const firstLine = codeLines[0]?.trim() ?? '';

    if (firstLine !== inputDeclaration) {
      toast.error('The $input declaration line must not be removed or modified.');
      return;
    }

    const userCodeLines = codeLines.slice(2);
    const userCode = userCodeLines.join('\n');

    if (!/return\s+/.test(userCode)) {
      toast.error('Your code must include a return statement.');
      return;
    }

    if (validateCode(code)) {
      updateNode(nodeId, {
        data: {
          ...getNode?.data,
          code: userCode,
        },
      });
      toast.success('Code saved successfully');
      onClose();
    } else {
      toast.error('Please fix syntax errors before saving.');
    }
  }, [code, inputDeclaration, nodeId, onClose, updateNode, validateCode, getNode]);

  return (
    <>
      <style>
        {`
          .locked-line-background {
            background-color: rgba(255, 0, 0, 0.05) !important;
          }
          .locked-line-glyph {
            background: none !important;
          }
          .monaco-editor, .monaco-editor-background, .monaco-editor .margin, .monaco-editor .lines-content {
            border-radius: 8px !important;
            font-family: 'Fira Code', monospace !important;
            font-size: 14px !important;
          }
          .monaco-editor {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .monaco-scrollable-element > .scrollbar > .slider {
            background: rgba(0,0,0,0.1) !important;
            border-radius: 4px !important;
          }
        `}
      </style>
      <Modal isOpen={isOpen} onClose={onClose} title="Code Editor" className="max-w-6xl max-h-[80vh]">
        <div className="flex h-[70vh]">
          <div className="w-1/3 border-r border-gray-300 dark:border-gray-700 overflow-y-auto">
            <InputDocs inputData={inputData} />
          </div>
          <div className="w-2/3 flex flex-col">
            <Editor
              height="100%"
              language="javascript"
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                readOnly: false,
                lineNumbers: 'on',
                minimap: { enabled: false },
                wordWrap: 'on',
                glyphMargin: true,
                fontLigatures: true,
                fontSize: 14,
                fontFamily: "'Fira Code', monospace",
              }}
            />
            {errors.length > 0 && (
              <div className="text-red-600 p-2">
                {errors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            )}
            <div className="p-2 border-t border-gray-300 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleSave}
                disabled={errors.length > 0}
                className="btn btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};