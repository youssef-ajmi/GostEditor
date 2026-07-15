import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Command, Child } from '@tauri-apps/plugin-shell';
import '@xterm/xterm/css/xterm.css';
import styles from './Terminal.module.css';

export default function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const shellRef = useRef<Child | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
      theme: {
        background: '#0d1117',
        foreground: '#e1e7ef',
        cursor: '#e1e7ef',
        selectionBackground: '#1a2744',
        black: '#3a4a6a',
        red: '#f14c4c',
        green: '#3fb950',
        yellow: '#e5c07b',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#56d4dd',
        white: '#e1e7ef',
        brightBlack: '#5a6a8a',
        brightRed: '#f14c4c',
        brightGreen: '#3fb950',
        brightYellow: '#e5c07b',
        brightBlue: '#58a6ff',
        brightMagenta: '#bc8cff',
        brightCyan: '#56d4dd',
        brightWhite: '#e1e7ef',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    term.open(containerRef.current);
    fitAddon.fit();

    const resizeObserver = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch {}
    });
    if (containerRef.current.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    xtermRef.current = term;

    let cancelled = false;

    async function startShell() {
      const shellCmd = (() => {
        if (navigator.platform.includes('Win')) return 'cmd.exe';
        return 'bash';
      })();

      try {
        const cmd = Command.create(shellCmd);
        let child: Child | null = null;

        cmd.stdout.on('data', (data: string) => {
          if (!cancelled) term.write(data);
        });
        cmd.stderr.on('data', (data: string) => {
          if (!cancelled) term.write(data);
        });
        cmd.on('close', () => {
          if (!cancelled) {
            term.write('\r\n\x1b[31m[Process completed]\x1b[0m\r\n');
          }
        });

        child = await cmd.spawn();
        if (cancelled) { child.kill(); return; }
        shellRef.current = child;

        term.onData((data: string) => {
          if (child) {
            child.write(data);
          }
        });
      } catch (e) {
        term.write(`\r\n\x1b[31mFailed to start shell: ${e}\x1b[0m\r\n`);
      }
    }

    startShell();

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      if (shellRef.current) {
        try { shellRef.current.kill(); } catch {}
        shellRef.current = null;
      }
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  return (
    <div className={styles.terminalContainer}>
      <div ref={containerRef} className={styles.terminalXterm} />
    </div>
  );
}