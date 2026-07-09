import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, highlightSpecialChars, rectangularSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { history } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import styles from './CodeEditor.module.css';

const code = `// Gost Template — Reactive Todo Application
// Built with signals, directives, and interpolation

import { signal, computed } from '@gost/reactive';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);
const filter = signal<string>('all');

const filteredTodos = computed(() => {
  if (filter() === 'active')
    return todos().filter(t => !t.done);
  if (filter() === 'done')
    return todos().filter(t => t.done);
  return todos();
});

function addTodo(text: string) {
  todos.update(prev => [...prev, { id: Date.now(), text, done: false }]);
}

render('#app', { todos: filteredTodos });`;

const gostTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    lineHeight: '1.8',
    height: '100%',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', monospace",
    overflow: 'auto',
  },
  '.cm-content': {
    caretColor: 'var(--purple-accent)',
    padding: '16px 0',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--purple-accent)',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(188, 140, 255, 0.15) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(188, 140, 255, 0.06)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-dim)',
    borderRight: '1px solid var(--border-subtle)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    minWidth: '64px',
    userSelect: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(188, 140, 255, 0.06)',
    color: 'var(--text-secondary)',
  },
  '.cm-lineNumbers': {
    paddingRight: '12px',
  },
  '&.cm-focused .cm-selectionBackgroundm .cm-selectionBackground': {
    backgroundColor: 'rgba(188, 140, 255, 0.15) !important',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'rgba(188, 140, 255, 0.1)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(188, 140, 255, 0.15)',
    outline: '1px solid rgba(188, 140, 255, 0.3)',
  },
  '.cm-nonmatchingBracket': {
    backgroundColor: 'rgba(255, 123, 114, 0.15)',
  },
});

export default function CodeEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const startState = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        highlightSpecialChars(),
        rectangularSelection(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        javascript({ typescript: true }),
        syntaxHighlighting(defaultHighlightStyle),
        oneDark,
        gostTheme,
        EditorView.lineWrapping,
        EditorState.tabSize.of(2),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return <div className={styles.editor} ref={editorRef} />;
}