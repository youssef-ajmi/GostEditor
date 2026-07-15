import { open } from '@tauri-apps/plugin-dialog';
import { useEditorStore } from './editorStore';

export async function openFileDialog() {
  const path = await open({
    multiple: false,
    title: 'Open File',
    filters: [
      { name: 'TypeScript', extensions: ['ts', 'tsx'] },
      { name: 'Go', extensions: ['go', 'mod', 'sum'] },
      { name: 'HTML', extensions: ['html', 'htm'] },
      { name: 'CSS', extensions: ['css'] },
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (!path) return;

  const name = path.split('\\').pop()?.split('/').pop() || path;
  const store = useEditorStore.getState();
  await store.openFile(path, name);
}
