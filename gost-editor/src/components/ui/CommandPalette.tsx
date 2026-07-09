import { useState, useEffect, useRef } from 'react';
import { Search, FileCode, Cog, Keyboard, Terminal } from 'lucide-react';
import styles from './CommandPalette.module.css';

type CommandItem = {
  icon: typeof Cog;
  label: string;
  shortcut: string;
  color?: string;
  type?: 'item';
} | {
  type: 'sep';
};

const commands: CommandItem[] = [
  { icon: FileCode, label: 'app.ts', shortcut: 'frontend/', color: '#3178c6' },
  { icon: FileCode, label: 'main.go', shortcut: 'backend/', color: '#00add8' },
  { icon: FileCode, label: 'template.ts', shortcut: '.gost/runtime/', color: '#3178c6' },
  { icon: FileCode, label: 'api.ts', shortcut: '.gost/generated/', color: '#3178c6' },
  { icon: FileCode, label: 'ws.go', shortcut: 'backend/', color: '#00add8' },
  { icon: FileCode, label: 'app.html', shortcut: 'frontend/', color: '#e34c26' },
  { type: 'sep' },
  { icon: Cog, label: 'Preferences', shortcut: 'Ctrl+,' },
  { icon: Keyboard, label: 'Keymap Settings', shortcut: 'Ctrl+K Ctrl+S' },
  { icon: Terminal, label: 'Toggle Terminal', shortcut: 'Ctrl+`' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = commands.filter((item): item is CommandItem & { type?: 'item' } => {
    if (item.type === 'sep') return false;
    if (!query) return true;
    return item.label.toLowerCase().includes(query.toLowerCase());
  });

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
        setSelected(s => Math.min(s + 1, items.length - 1));
      }
      if (open && e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(s => Math.max(s - 1, 0));
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, items.length]);

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
          {commands.map((item, i) => {
            if (item.type === 'sep') {
              return <div key={i} className={styles.sep} />;
            }
            const Icon = item.icon;
            const isSelected = i === selected;
            return (
              <div
                key={i}
                className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                onClick={() => { setOpen(false); }}
                onMouseEnter={() => setSelected(i)}
              >
                <Icon size={12} style={{ color: item.color || 'var(--text-dim)' }} />
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