import { XCircle, AlertTriangle, FileCode, Globe, ArrowDown, Indent, MapPin, MousePointer2, Microchip, Save } from 'lucide-react';
import styles from './StatusBar.module.css';
import { useEditorStore } from '../../store/editorStore';

export default function StatusBar() {
  const autoSave = useEditorStore((s) => s.settings.autoSave);
  const setSettings = useEditorStore((s) => s.setSettings);
  const problems = useEditorStore((s) => s.problems);
  const cursor = useEditorStore((s) => s.editor.cursor);
  const selected = useEditorStore((s) => s.editor.selected);
  const tabSize = useEditorStore((s) => s.settings.tabSize);
  const activeTab = useEditorStore((s) => s.tabs.items.find((t) => t.id === s.tabs.activeId));

  const errors = problems.filter((p) => p.type === 'error').length;
  const warnings = problems.filter((p) => p.type === 'warning').length;
  const lang = activeTab?.language || 'Plain Text';

  return (
    <div className={styles.statusBar}>
      <div className={styles.statusLeft}>
        <span className={styles.statusItem} title="Errors and Warnings">
          <XCircle size={11} style={{ color: 'var(--red-accent)' }} /> {errors}
          <AlertTriangle size={11} style={{ color: 'var(--yellow-accent)', marginLeft: 4 }} /> {warnings}
        </span>
      </div>
      <div className={styles.statusRight}>
        <span className={styles.statusItem} title="Language Mode">
          <FileCode size={11} /> {lang}
        </span>
        <span className={styles.statusItem} title="File Encoding">
          <Globe size={11} /> UTF-8
        </span>
        <span className={styles.statusItem} title="Line Ending">
          <ArrowDown size={11} /> LF
        </span>
        <span className={styles.statusItem} title="Indentation">
          <Indent size={11} /> Spaces: {tabSize}
        </span>
        <span className={styles.statusSep}>|</span>
        <span className={styles.statusItem} title="Go to Line">
          <MapPin size={11} /> Ln {cursor.line}, Col {cursor.col}
        </span>
        <span className={styles.statusItem} title="Selection">
          <MousePointer2 size={11} /> {selected > 0 ? `${selected} selected` : '0 selected'}
        </span>
        <span className={styles.sep}>|</span>
        <span className={`${styles.statusToggle} ${autoSave ? styles.on : styles.off}`} title={autoSave ? 'Auto-save: on — click to disable' : 'Auto-save: off — click to enable'} onClick={() => setSettings({ autoSave: !autoSave })}>
          <Save size={11} /> {autoSave ? 'Auto' : 'Manual'}
        </span>
        <span className={styles.sep}>|</span>
        <span className={styles.statusItem} title="Memory Usage">
          <Microchip size={11} style={{ color: 'var(--blue-accent)' }} />
        </span>
      </div>
    </div>
  );
}