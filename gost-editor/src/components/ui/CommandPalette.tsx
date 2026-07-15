import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, FileCode, Cog, Terminal, FolderOpen, Save, X, Sidebar, PanelRight, Plus, SunMoon } from 'lucide-react';
import styles from './CommandPalette.module.css';
import { useEditorStore, FileNode } from '../../store/editorStore';

type FileItem = {
  type: 'file';
  icon: typeof FileCode;
  label: string;
  subtitle: string;
  color: string;
  path: string;
};

type ActionItem = {
  type: 'action';
  icon: typeof Cog;
  label: string;
  shortcut: string;
  action: () => void;
};

type Sep = { type: 'sep' };

type CommandItem = FileItem | ActionItem | Sep;

function flattenTree(nodes: FileNode[], prefix = ''): FileItem[] {
  const result: FileItem[] = [];
  for (const node of nodes) {
    const label = node.name;
    const subtitle = prefix;
    const ext = node.name.split('.').pop()?.toLowerCase() || '';
    const colorMap: Record<string, string> = {
      ts: '#3178c6', tsx: '#3178c6', js: '#f0db4f', jsx: '#f0db4f',
      go: '#00add8', html: '#e34c26', css: '#563d7c', json: '#f0883e',
      md: '#58a6ff', py: '#3776ab', rs: '#dea584', java: '#b07219',
      xml: '#0060ac', yaml: '#6a6a8a', sql: '#e38c00',
    };
    const color = colorMap[ext] || 'var(--text-muted)';
    if (node.type === 'file' && node.path) {
      result.push({ type: 'file', icon: FileCode, label, subtitle, color, path: node.path });
    }
    if (node.children) {
      result.push(...flattenTree(node.children, prefix ? `${prefix}/${node.name}` : node.name));
    }
  }
  return result;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileTree = useEditorStore((s) => s.workspace.fileTree);
  const store = useEditorStore.getState;

  const fileItems = useMemo(() => flattenTree(fileTree), [fileTree]);

  const actionItems: ActionItem[] = [
    { type: 'action', icon: Plus, label: 'New File', shortcut: 'Ctrl+N', action: () => store().newFile() },
    { type: 'action', icon: Save, label: 'Save', shortcut: 'Ctrl+S', action: () => { const s = store(); if (s.tabs.activeId) s.saveFile(s.tabs.activeId).catch(console.error); } },
    { type: 'action', icon: Save, label: 'Save All', shortcut: 'Ctrl+Shift+S', action: () => store().saveAll().catch(console.error) },
    { type: 'action', icon: X, label: 'Close Tab', shortcut: 'Ctrl+F4', action: () => { const s = store(); if (s.tabs.activeId) s.closeTab(s.tabs.activeId); } },
    { type: 'action', icon: FolderOpen, label: 'Open Folder', shortcut: 'Ctrl+Shift+O', action: async () => { const { openFolder } = await import('../../store/openFolder'); await openFolder(); } },
    { type: 'action', icon: Sidebar, label: 'Toggle Sidebar', shortcut: 'Ctrl+B', action: () => store().toggleLeft() },
    { type: 'action', icon: PanelRight, label: 'Toggle Right Panel', shortcut: '', action: () => store().toggleRight() },
    { type: 'action', icon: Terminal, label: 'Toggle Terminal', shortcut: 'Ctrl+`', action: () => store().setRightOpen(!store().panels.rightOpen) },
    { type: 'action', icon: SunMoon, label: 'Toggle Theme', shortcut: '', action: () => store().toggleTheme() },
  ];

  const allItems: CommandItem[] = [
    ...fileItems,
    ...(fileItems.length > 0 ? [{ type: 'sep' as const }] : []),
    ...actionItems,
  ];

  const filtered = useMemo(() => {
    if (!query) return allItems;
    const q = query.toLowerCase();
    return allItems.filter((item) => {
      if (item.type === 'sep') return true;
      return item.label.toLowerCase().includes(q) || ('subtitle' in item && item.subtitle.toLowerCase().includes(q));
    });
  }, [query, allItems]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setOpen(prev => {
          if (!prev) setTimeout(() => inputRef.current?.focus(), 100);
          return !prev;
        });
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
      if (open && e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(s => {
          let next = s;
          do { next = Math.min(next + 1, filtered.length - 1); } while (next < filtered.length - 1 && filtered[next]?.type === 'sep');
          return next;
        });
      }
      if (open && e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(s => {
          let prev = s;
          do { prev = Math.max(prev - 1, 0); } while (prev > 0 && filtered[prev]?.type === 'sep');
          return prev;
        });
      }
      if (open && e.key === 'Enter') {
        e.preventDefault();
        const item = filtered[selected];
        if (!item || item.type === 'sep') return;
        if (item.type === 'file') {
          store().openFile(item.path, item.label).catch(console.error);
        } else {
          item.action();
        }
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, filtered, selected]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrap}>
          <Search size={14} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search files, actions, or symbols..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
          />
        </div>
        <div className={styles.list}>
          {filtered.map((item, i) => {
            if (item.type === 'sep') {
              return <div key={`sep-${i}`} className={styles.sep} />;
            }
            const isSelected = i === selected;
            if (item.type === 'file') {
              return (
                <div
                  key={item.path}
                  className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                  onClick={() => { store().openFile(item.path, item.label).catch(console.error); setOpen(false); }}
                  onMouseEnter={() => setSelected(i)}
                >
                  <FileCode size={12} style={{ color: item.color }} />
                  <span className={styles.label}>{item.label}</span>
                  <span className={styles.shortcut}>{item.subtitle}</span>
                </div>
              );
            }
            return (
              <div
                key={item.label}
                className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                onClick={() => { item.action(); setOpen(false); }}
                onMouseEnter={() => setSelected(i)}
              >
                <item.icon size={12} style={{ color: 'var(--text-dim)' }} />
                <span className={styles.label}>{item.label}</span>
                <span className={styles.shortcut}>{item.shortcut}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}