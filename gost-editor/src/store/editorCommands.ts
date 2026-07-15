import { EditorView } from '@codemirror/view';
import { selectAll, undo, redo } from '@codemirror/commands';
import { openSearchPanel } from '@codemirror/search';
import { Command } from '@tauri-apps/plugin-shell';

export let activeView: EditorView | null = null;

export function setActiveEditorView(view: EditorView | null) {
  activeView = view;
}

export async function runShell(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  const shellCmd = navigator.platform.includes('Win') ? 'cmd.exe' : 'bash';
  const winArgs = navigator.platform.includes('Win') ? ['/C', cmd, ...args] : ['-c', `${cmd} ${args.join(' ')}`];
  try {
    const result = await Command.create(shellCmd, winArgs).execute();
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
