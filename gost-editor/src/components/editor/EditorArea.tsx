import { Plus, Columns, X } from 'lucide-react';
import CodeEditor from './CodeEditor';
import Minimap from './Minimap';
import styles from './EditorArea.module.css';
import { useEditorStore } from '../../store/editorStore';

const iconMap: Record<string, { bg: string; char: string }> = {
  ts: { bg: '#3178c6', char: 'T' },
  tsx: { bg: '#3178c6', char: 'T' },
  js: { bg: '#f0db4f', char: 'J' },
  jsx: { bg: '#f0db4f', char: 'J' },
  go: { bg: '#00add8', char: 'G' },
  html: { bg: '#e34c26', char: 'H' },
  css: { bg: '#563d7c', char: '#' },
  json: { bg: '#f0883e', char: '{' },
  md: { bg: '#58a6ff', char: 'M' },
  py: { bg: '#3776ab', char: 'P' },
  rs: { bg: '#dea584', char: 'R' },
  java: { bg: '#b07219', char: 'J' },
  xml: { bg: '#0060ac', char: '<' },
  yaml: { bg: '#6a6a8a', char: 'Y' },
};

function FileIcon({ name, lang }: { name: string; lang?: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const info = iconMap[ext] || iconMap[lang || ''] || { bg: 'var(--text-muted)', char: 'F' };
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill={info.bg}>
      <rect x="1" y="1" width="22" height="22" rx="2" />
      <text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{info.char}</text>
    </svg>
  );
}

export default function EditorArea() {
  const tabs = useEditorStore((s) => s.tabs);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const newFile = useEditorStore((s) => s.newFile);
  const dirtyCount = tabs.dirty.size;

  return (
    <>
      <div className={styles.tabsBar}>
        {tabs.items.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${tab.id === tabs.activeId ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}><FileIcon name={tab.name} lang={tab.language} /></span>
            <span className={styles.tabName}>{tab.name}</span>
            {tabs.dirty.has(tab.id) ? (
              <span className={styles.tabModified} />
            ) : (
              <span className={styles.tabSaved} />
            )}
            <span
              className={styles.tabClose}
              title="Close"
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
            >
              <X size={9} />
            </span>
          </div>
        ))}
        <div className={styles.tabAdd} title="New Tab" onClick={newFile}>
          <Plus size={12} />
        </div>
        {dirtyCount > 0 && (
          <div className={styles.unsavedIndicator} title="Save All (Ctrl+Shift+S)">
            <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="var(--yellow-accent)" /></svg>
            {dirtyCount} unsaved
          </div>
        )}
        <div className={styles.tabOverflow}>
          <button title="Split Editor" disabled><Columns size={11} /></button>
        </div>
      </div>

      <div className={styles.editorWrapper}>
        <div className={styles.editorScrollArea}>
          <CodeEditor />
          <Minimap />
        </div>
      </div>
    </>
  );
}