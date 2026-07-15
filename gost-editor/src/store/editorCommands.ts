import { EditorView } from '@codemirror/view';
import { selectAll, undo, redo } from '@codemirror/commands';
import { openSearchPanel } from '@codemirror/search';

export let activeView: EditorView | null = null;

export function setActiveEditorView(view: EditorView | null) {
  activeView = view;
}

export function executeEditorAction(action: string) {
  if (!activeView) return;
  switch (action) {
    case 'undo':
      undo(activeView);
      break;
    case 'redo':
      redo(activeView);
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
      selectAll(activeView);
      break;
    case 'find':
      openSearchPanel(activeView);
      break;
  }
}
