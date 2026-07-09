import { GitBranch, XCircle, AlertTriangle, FileCode, Globe, ArrowDown, Indent, MapPin, MousePointer2, Microchip } from 'lucide-react';
import styles from './StatusBar.module.css';

export default function StatusBar() {
  return (
    <div className={styles.statusBar}>
      <div className={styles.statusLeft}>
        <span className={styles.statusItem} title="Git Branch">
          <GitBranch size={11} style={{ color: 'var(--purple-accent)' }} />
          <span className={styles.branchBadge}>main</span>
        </span>
        <span className={styles.statusItem} title="Errors and Warnings">
          <XCircle size={11} style={{ color: 'var(--red-accent)' }} /> 1
          <AlertTriangle size={11} style={{ color: 'var(--yellow-accent)', marginLeft: 4 }} /> 1
        </span>
      </div>
      <div className={styles.statusRight}>
        <span className={styles.statusItem} title="Language Mode">
          <FileCode size={11} /> TypeScript
        </span>
        <span className={styles.statusItem} title="File Encoding">
          <Globe size={11} /> UTF-8
        </span>
        <span className={styles.statusItem} title="Line Ending">
          <ArrowDown size={11} /> LF
        </span>
        <span className={styles.statusItem} title="Indentation">
          <Indent size={11} /> Spaces: 2
        </span>
        <span className={styles.statusSep}>|</span>
        <span className={styles.statusItem} title="Go to Line">
          <MapPin size={11} /> Ln 12, Col 1
        </span>
        <span className={styles.statusItem} title="Selection">
          <MousePointer2 size={11} /> 0 selected
        </span>
        <span className={styles.sep}>|</span>
        <span className={styles.statusItem} title="Memory Usage">
          <Microchip size={11} style={{ color: 'var(--blue-accent)' }} /> 1.2 GB
        </span>
      </div>
    </div>
  );
}