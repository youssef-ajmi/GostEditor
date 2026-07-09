import { Bug, Plus, Columns, Eraser, ChevronUp, XCircle, AlertTriangle } from 'lucide-react';
import styles from './RightPanel.module.css';

const problems = [
  { type: 'error' as const, message: "Property 'done' may not exist on type 'Todo'", file: 'app.ts:18', action: 'quick fix available' },
  { type: 'warning' as const, message: "Variable 'filter' shadows built-in Array.filter", file: 'app.ts:13', action: 'rename variable' },
];

export default function RightPanel() {
  return (
    <>
      <div className={styles.rpSection}>
        <div className={styles.rpTitle}>
          <PlayIcon size={11} />
          Run & Debug
        </div>
        <div className={styles.runConfig}>
          <div className={styles.configRow}>
            <span className={styles.configLabel}>Config</span>
            <span className={styles.configValue}>Gost: dev</span>
          </div>
          <div className={styles.configRow}>
            <span className={styles.configLabel}>Target</span>
            <span className={styles.configValue}>app.ts</span>
          </div>
          <div className={styles.configRow}>
            <span className={styles.configLabel}>Env</span>
            <span className={styles.configValue}>development</span>
          </div>
          <div className={styles.configRow}>
            <span className={styles.configLabel}>Port</span>
            <span className={styles.configValue}>3000</span>
          </div>
          <button className={styles.runButton}>
            <PlayIcon size={12} />
            Run 'Gost'
          </button>
        </div>
      </div>

      <div className={`${styles.rpSection} ${styles.problemsSection}`}>
        <div className={styles.rpTitle}>
          <Bug size={11} />
          Problems
          <span className={styles.problemCount}>2</span>
        </div>
        <div className={styles.problemsList}>
          {problems.map((p, i) => (
            <div key={i} className={`${styles.problem} ${styles[p.type]}`}>
              {p.type === 'error' && <XCircle size={12} />}
              {p.type === 'warning' && <AlertTriangle size={12} />}
              <div>
                <div className={styles.problemText}>{p.message}</div>
                <span className={styles.fileRef}>{p.file} · {p.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.terminalSection}>
        <div className={styles.terminalHeader}>
          <div className={styles.thTitle}>
            <TerminalIcon size={11} />
            Terminal
          </div>
          <div className={styles.thActions}>
            <button title="New Terminal"><Plus size={10} /></button>
            <button title="Split Terminal"><Columns size={10} /></button>
            <button title="Clear Terminal"><Eraser size={10} /></button>
            <button title="Maximize Terminal"><ChevronUp size={10} /></button>
          </div>
        </div>
        <div className={styles.terminalBody}>
          <div className={styles.termLine}><span className={styles.prompt}>$ </span><span className={styles.cmd}>gost build --watch</span></div>
          <div className={styles.termLine}><span className={styles.infoText}>✓ Compiling frontend...</span></div>
          <div className={styles.termLine}><span className={styles.success}>✓ Build completed in 1.2s</span></div>
          <div className={styles.termLine}><span className={styles.infoText}>✓ Server running on http://localhost:3000</span></div>
          <div className={styles.termLine} style={{ color: 'var(--text-dim)' }}>[Gost] watching for changes...</div>
          <div className={styles.termLine}><span className={styles.prompt}>$ </span><span className={styles.cursor} /></div>
        </div>
      </div>
    </>
  );
}

function PlayIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function TerminalIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}