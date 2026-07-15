import { useEffect, useRef, useState } from 'react';
import { Copy, Scissors, Clipboard, CheckSquare, Undo, Redo, Search } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
}

const items = [
  { id: 'undo', icon: Undo, label: 'Undo', shortcut: 'Ctrl+Z' },
  { id: 'redo', icon: Redo, label: 'Redo', shortcut: 'Ctrl+Shift+Z' },
  { type: 'separator' as const },
  { id: 'copy', icon: Copy, label: 'Copy', shortcut: 'Ctrl+C' },
  { id: 'cut', icon: Scissors, label: 'Cut', shortcut: 'Ctrl+X' },
  { id: 'paste', icon: Clipboard, label: 'Paste', shortcut: 'Ctrl+V' },
  { type: 'separator' as const },
  { id: 'selectAll', icon: CheckSquare, label: 'Select All', shortcut: 'Ctrl+A' },
  { type: 'separator' as const },
  { id: 'find', icon: Search, label: 'Find', shortcut: 'Ctrl+F' },
];

export default function ContextMenu({ x, y, onClose, onAction }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPos({
      left: Math.min(x, vw - rect.width - 8),
      top: Math.min(y, vh - rect.height - 8),
    });
  }, [x, y]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        zIndex: 1000,
        minWidth: 180,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '6px',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
        animation: 'contextIn 0.12s ease both',
        fontFamily: "'Inter', sans-serif",
        fontSize: '12px',
      }}
    >
      {items.map((item, i) => {
        if ('type' in item) {
          return (
            <div
              key={i}
              style={{
                height: 1,
                background: 'var(--border-primary)',
                margin: '4px 8px',
              }}
            />
          );
        }
        return (
          <div
            key={item.id}
            onClick={() => { onAction(item.id); onClose(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)';
              (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
            }}
          >
            <item.icon size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{item.shortcut}</span>
          </div>
        );
      })}
    </div>
  );
}
