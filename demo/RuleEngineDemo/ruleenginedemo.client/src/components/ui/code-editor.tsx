import React from 'react';
import Editor, { EditorProps, useMonaco } from '@monaco-editor/react';

interface CodeEditorProps extends Omit<EditorProps, 'theme'> {
  language: 'json' | 'csharp';
  value: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({ language, value, onChange, readOnly = false, height = "300px", ...props }: CodeEditorProps) {
  const monaco = useMonaco();

  React.useEffect(() => {
    if (monaco) {
      // Define a custom theme to match our app if needed
      monaco.editor.defineTheme('nergora-theme', {
        base: 'vs-dark', // or vs based on app theme, assuming dark for modern feel
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#00000000', // transparent so it blends with container
        }
      });
      // Try to set theme, fallback to vs-dark if transparent is tricky
    }
  }, [monaco]);

  return (
    <div className={`border rounded-md overflow-hidden ${readOnly ? 'opacity-80' : ''}`}>
      <Editor
        height={height}
        language={language}
        theme="vs-dark" // using vs-dark by default as it usually looks premium
        value={value}
        onChange={onChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          padding: { top: 12, bottom: 12 },
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          roundedSelection: true,
          ...props.options
        }}
        {...props}
      />
    </div>
  );
}
