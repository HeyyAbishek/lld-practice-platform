import Editor, { type OnMount } from '@monaco-editor/react';
import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export function CodeEditor({ value, onChange }: Props) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('lld-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5b6175', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'a78bfa' },
        { token: 'type', foreground: '22d3ee' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'identifier', foreground: 'e2e8f0' },
      ],
      colors: {
        'editor.background': '#0d0e16',
        'editor.lineHighlightBackground': '#161823',
        'editorLineNumber.foreground': '#3b3f55',
        'editorLineNumber.activeForeground': '#a78bfa',
        'editor.selectionBackground': '#7c3aed44',
        'editorCursor.foreground': '#f472b6',
      },
    });
    monaco.editor.setTheme('lld-dark');
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="java"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      onMount={handleMount}
      options={{
        fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular',
        fontSize: 13.5,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        roundedSelection: true,
        renderLineHighlight: 'all',
        padding: { top: 16, bottom: 16 },
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        automaticLayout: true,
        wordWrap: 'on',
        tabSize: 4,
      }}
    />
  );
}
