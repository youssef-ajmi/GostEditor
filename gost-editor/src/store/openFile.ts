import { open } from '@tauri-apps/plugin-dialog';
import { useEditorStore } from './editorStore';

export async function openFileDialog() {
  const path = await open({
    multiple: false,
    title: 'Open File',
    filters: [{ name: 'All Files', extensions: ['*'] }],
  });
  if (!path) return;

  const name = path.split('\\').pop()?.split('/').pop() || path;
  const store = useEditorStore.getState();
  await store.openFile(path, name);
}
