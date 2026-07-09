import { useState } from 'react';
import { ChevronRight, Plus, Columns, X } from 'lucide-react';
import CodeEditor from './CodeEditor';
import Minimap from './Minimap';
import styles from './EditorArea.module.css';

interface Tab {
  id: string;
  name: string;
  icon: React.ReactNode;
  modified: boolean;
  active: boolean;
}

const iconTs = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="#3178c6">
    <rect x="1" y="1" width="22" height="22" rx="2" />
    <text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">T</text>
  </svg>
);

const iconGo = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#00add8" strokeWidth="2">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const initialTabs: Tab[] = [
  { id: 'main.go', name: 'main.go', icon: iconGo, modified: false, active: false },
  { id: 'app.ts', name: 'app.ts', icon: iconTs, modified: true, active: true },
  { id: 'template.ts', name: 'template.ts', icon: iconTs, modified: false, active: false },
  { id: 'api.ts', name: 'api.ts', icon: iconTs, modified: true, active: false },
];

export default function EditorArea() {
  const [tabs, setTabs] = useState<Tab[]>(initialTabs);

  const closeTab = (id: string) => {
    setTabs(tabs.filter(t => t.id !== id));
  };

  return (
    <>
      <div className={styles.breadcrumbs}>
        <span>my-app</span>
        <ChevronRight size={9} className={styles.bcSep} />
        <span>frontend</span>
        <ChevronRight size={9} className={styles.bcSep} />
        <span className={styles.bcCurrent}>app.ts</span>
      </div>

      <div className={styles.tabsBar}>
        {tabs.map((tab: Tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${tab.active ? styles.active : ''}`}
            onClick={() => {
              setTabs(tabs.map(t => ({ ...t, active: t.id === tab.id })));
            }}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabName}>{tab.name}</span>
            {tab.modified ? (
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
        <div className={styles.tabAdd} title="New Tab">
          <Plus size={12} />
        </div>
        <div className={styles.unsavedIndicator} title="Save All (Ctrl+Shift+S)">
          <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="var(--yellow-accent)" /></svg>
          2 unsaved
        </div>
        <div className={styles.tabOverflow}>
          <button title="Split Editor"><Columns size={11} /></button>
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