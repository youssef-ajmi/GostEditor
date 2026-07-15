import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, highlightSpecialChars, rectangularSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { history } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { syntaxTree } from '@codemirror/language';
import { search, searchKeymap } from '@codemirror/search';
import { autocompletion } from '@codemirror/autocomplete';
import { lintGutter, linter, Diagnostic } from '@codemirror/lint';
import { tags as t } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { go } from '@codemirror/lang-go';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { java } from '@codemirror/lang-java';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { sql } from '@codemirror/lang-sql';
import { setActiveEditorView } from '../../store/editorCommands';
import { useEditorStore, Problem } from '../../store/editorStore';
import styles from './CodeEditor.module.css';
import emptyStyles from './EmptyEditor.module.css';

const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    lineHeight: '1.8',
    height: '100%',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: "'JetBrains Mono', monospace", overflow: 'auto' },
  '.cm-content': { caretColor: 'var(--text-primary)', padding: '16px 0' },
  '.cm-cursor': { borderLeftColor: 'var(--text-primary)', borderLeftWidth: '2px' },
  '.cm-selectionBackground': { backgroundColor: 'var(--accent-glow-strong) !important' },
  '.cm-activeLine': { backgroundColor: 'var(--accent-glow)' },
  '.cm-gutters': { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-dim)', borderRight: '1px solid var(--border-primary)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', minWidth: '48px', userSelect: 'none' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' },
  '.cm-lineNumbers': { paddingRight: '8px' },
  '.cm-matchingBracket': { backgroundColor: 'var(--accent-glow)', outline: '1px solid var(--accent-glow-strong)' },
  '.cm-nonmatchingBracket': { backgroundColor: 'rgba(255, 123, 114, 0.2)' },
});

const editorHighlight = HighlightStyle.define([
  { tag: t.keyword, color: 'var(--accent)' },
  { tag: t.string, color: 'var(--green-accent)' },
  { tag: t.comment, color: 'var(--text-dim)', fontStyle: 'italic' },
  { tag: t.number, color: 'var(--cyan-accent)' },
  { tag: t.typeName, color: 'var(--yellow-accent)' },
  { tag: t.className, color: 'var(--yellow-accent)' },
  { tag: [t.function(t.variableName), t.function(t.definition(t.variableName))], color: 'var(--blue-accent)' },
  { tag: t.variableName, color: 'var(--text-primary)' },
  { tag: t.operator, color: 'var(--text-secondary)' },
  { tag: t.punctuation, color: 'var(--text-secondary)' },
  { tag: t.bool, color: 'var(--accent)' },
  { tag: t.regexp, color: 'var(--green-accent)' },
  { tag: t.tagName, color: 'var(--accent)' },
  { tag: t.attributeName, color: 'var(--text-secondary)' },
  { tag: t.propertyName, color: 'var(--text-secondary)' },
  { tag: t.namespace, color: 'var(--cyan-accent)' },
  { tag: t.meta, color: 'var(--yellow-accent)' },
  { tag: t.docString, color: 'var(--text-dim)' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.link, color: 'var(--blue-accent)', textDecoration: 'underline' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
]);

const langExtensions: Record<string, () => import('@codemirror/language').LanguageSupport> = {
  typescript: () => javascript({ typescript: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  javascript: () => javascript(),
  jsx: () => javascript({ jsx: true }),
  go: () => go(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  markdown: () => markdown(),
  python: () => python(),
  rust: () => rust(),
  java: () => java(),
  xml: () => xml(),
  yaml: () => yaml(),
  sql: () => sql(),
};

const SAVE_DELAY = 800;

export default function CodeEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const skipSync = useRef(false);
  const activeId = useEditorStore((s) => s.tabs.activeId);
  const fileContent = useEditorStore((s) => (s.tabs.activeId ? s.fileContents[s.tabs.activeId] : ''));
  const tabs = useEditorStore((s) => s.tabs);
  const setFileContent = useEditorStore((s) => s.setFileContent);
  const saveFile = useEditorStore((s) => s.saveFile);
  const autoSave = useEditorStore((s) => s.settings.autoSave);
  const setCursor = useEditorStore((s) => s.setCursor);
  const activeTab = tabs.items.find((t) => t.id === activeId);

  // Create/destroy editor when switching files
  useEffect(() => {
    if (!editorRef.current) return;

    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    if (!activeTab) {
      setActiveEditorView(null);
      return;
    }

    const langExt = activeTab.language ? langExtensions[activeTab.language] : undefined;

    const setProblems = useEditorStore.getState().setProblems;

    const customLinter = linter((view) => {
      const diagnostics: Diagnostic[] = [];
      const problems: Problem[] = [];
      const tree = syntaxTree(view.state);
      tree.iterate({
        enter: (node) => {
          if (node.name === '⚠') {
            const from = node.from;
            const line = view.state.doc.lineAt(from);
            const msg = view.state.sliceDoc(from, node.to);
            diagnostics.push({
              from,
              to: node.to,
              severity: 'error',
              message: msg || 'Syntax error',
            });
            problems.push({
              type: 'error',
              message: msg || 'Syntax error',
              file: activeId || '',
              line: line.number,
            });
          }
        },
      });
      if (activeId) setProblems(problems);
      return diagnostics;
    });

    const state = EditorState.create({
      doc: fileContent || '',
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        highlightSpecialChars(),
        rectangularSelection(),
        history(),
        search(),
        autocompletion(),
        lintGutter(),
        customLinter,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          indentWithTab,
          { key: 'Ctrl-s', run: () => { if (activeId) saveFile(activeId); return true; } },
          { key: 'Cmd-s', run: () => { if (activeId) saveFile(activeId); return true; } },
        ]),
        langExt ? langExt() : [],
        syntaxHighlighting(editorHighlight),
        editorTheme,
        EditorView.lineWrapping,
        EditorState.tabSize.of(2),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && activeId && !skipSync.current) {
            skipSync.current = true;
            setFileContent(activeId, update.state.doc.toString());

            if (saveTimers.current.has(activeId)) clearTimeout(saveTimers.current.get(activeId));
            if (autoSave) {
              saveTimers.current.set(activeId, setTimeout(() => {
                saveFile(activeId);
                saveTimers.current.delete(activeId);
              }, SAVE_DELAY));
            }
          }
          if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            setCursor({ line: line.number, col: pos - line.from + 1 });
            const sel = update.state.selection.main;
            const selectedLen = Math.abs(sel.from - sel.to);
            useEditorStore.setState((s) => ({ editor: { ...s.editor, selected: selectedLen } }));
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;
    setActiveEditorView(view);

    return () => {
      setActiveEditorView(null);
      view.destroy();
      viewRef.current = null;
    };
  }, [activeId]);

  // Sync external content changes without destroying/recreating editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !activeId || !activeTab) return;

    if (skipSync.current) {
      skipSync.current = false;
      return;
    }

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== fileContent) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: fileContent || '' },
      });
    }
  }, [fileContent]);

  if (!activeTab) {
    return (
      <div className={emptyStyles.empty}>
        <div className={emptyStyles.icon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <span>No file open</span>
        <span>Select a file from the project tree</span>
      </div>
    );
  }

  return <div className={styles.editor} ref={editorRef} data-editor-area onContextMenu={(e) => e.preventDefault()} />;
}