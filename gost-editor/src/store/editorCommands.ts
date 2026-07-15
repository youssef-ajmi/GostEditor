import type { EditorView } from '@codemirror/view';
import type { Diagnostic } from '@codemirror/lint';
import { selectAll, undo, redo } from '@codemirror/commands';
import { openSearchPanel } from '@codemirror/search';
import { Command } from '@tauri-apps/plugin-shell';
import { useEditorStore, Problem } from './editorStore';

export let activeView: EditorView | null = null;

export function setActiveEditorView(view: EditorView | null) {
  activeView = view;
}

export async function runShell(cmd: string, args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; code: number }> {
  const shellCmd = navigator.platform.includes('Win') ? 'cmd.exe' : 'bash';
  const winArgs = navigator.platform.includes('Win') ? ['/C', cmd, ...args] : ['-c', `${cmd} ${args.join(' ')}`];
  try {
    const opts: Record<string, unknown> = {};
    if (cwd) opts.cwd = cwd;
    const result = await Command.create(shellCmd, winArgs, opts).execute();
    return { stdout: result.stdout || '', stderr: result.stderr || '', code: result.code || 0 };
  } catch (e) {
    return { stdout: '', stderr: String(e), code: 1 };
  }
}

export function executeEditorAction(action: string) {
  switch (action) {
    case 'undo':
      if (activeView) undo(activeView);
      break;
    case 'redo':
      if (activeView) redo(activeView);
      break;
    case 'copy':
      document.execCommand('copy');
      break;
    case 'cut':
      document.execCommand('cut');
      break;
    case 'paste':
      navigator.clipboard.readText().then((text) => {
        activeView?.dispatch({ changes: { from: activeView.state.selection.main.head, insert: text } });
      });
      break;
    case 'selectAll':
      if (activeView) selectAll(activeView);
      break;
    case 'find':
      if (activeView) openSearchPanel(activeView);
      break;
  }
}

export const vetDiagnostics = new Map<string, Diagnostic[]>();

export async function runGoVet(filePath: string): Promise<void> {
  const dir = filePath.split('\\').slice(0, -1).join('\\');
  const fileName = filePath.split('\\').pop() || '';
  try {
    const res = await runShell('go', ['vet', `./${fileName}`], dir);
    const diags: Diagnostic[] = [];
    const problems: Problem[] = [];
    const text = res.stderr || res.stdout || '';
    const lineRe = /^(.+?):(\d+):(\d+):\s*(.+)$/gm;
    let match: RegExpExecArray | null;
    while ((match = lineRe.exec(text)) !== null) {
      const fileMatch = match[1].replace(/\\/g, '/');
      const line = parseInt(match[2], 10);
      const msg = match[4];
      if (!fileMatch.endsWith(fileName)) continue;
      diags.push({
        from: Math.max(0, line - 1),
        to: Math.max(0, line - 1) + 1,
        severity: 'error',
        message: msg,
      });
      problems.push({
        type: 'error',
        message: msg,
        file: filePath,
        line,
      });
    }
    vetDiagnostics.set(filePath, diags);
    useEditorStore.getState().setProblems(problems);
    if (activeView) {
      activeView.dispatch({});
    }
  } catch {}
}
