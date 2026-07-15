import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { activeView } from '../../store/editorCommands';
import styles from './CommandPalette.module.css';

export default function GoToLine() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cursor = useEditorStore((s) => s.editor.cursor);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setOpen(true);
        setValue(String(cursor.line));
        setError('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
      if (open && e.key === 'Enter') {
        e.preventDefault();
        const line = parseInt(value, 10);
        if (isNaN(line) || line < 1) {
          setError('Invalid line number');
          return;
        }
        if (activeView) {
          const doc = activeView.state.doc;
          const maxLine = doc.lines;
          if (line > maxLine) {
            setError(`Line ${line} exceeds document (max: ${maxLine})`);
            return;
          }
          const pos = doc.line(line).from;
          activeView.dispatch({
            selection: { anchor: pos },
            scrollIntoView: true,
          });
          activeView.focus();
        }
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, value, cursor.line]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div className={styles.palette} style={{ maxWidth: 300 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrap}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Go to line..."
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            style={{ paddingLeft: 8 }}
          />
        </div>
        {error && (
          <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--red-accent)' }}>{error}</div>
        )}
      </div>
    </div>
  );
}