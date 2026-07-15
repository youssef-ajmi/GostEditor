import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useEditorStore, FileNode } from './editorStore';

export async function openFolder() {
  const path = await open({ directory: true, multiple: false, title: 'Open Project' });
  if (!path) return;

  const store = useEditorStore.getState();
  try {
    const info = await invoke<{ name: string; path: string; files: { name: string; path: string; is_dir: boolean; size: number }[] }>('open_workspace', { path });

    const root: FileNode = {
      name: info.name,
      type: 'folder',
      path: info.path,
      children: info.files.map((f) => ({
        name: f.name,
        type: f.is_dir ? 'folder' as const : 'file' as const,
        path: f.path,
        children: f.is_dir ? [] as FileNode[] : undefined,
      })),
    };

    useEditorStore.setState((s) => ({
      workspace: {
        ...s.workspace,
        path: info.path,
        name: info.name,
        fileTree: [root],
      },
    }));
    localStorage.setItem('gost-workspace-path', info.path);
    store.addRecentProject(info.path);
  } catch (e) {
    console.error('Failed to open workspace:', e);
  }
}

export async function openRecentFolder(path: string) {
  const store = useEditorStore.getState();
  try {
    const info = await invoke<{ name: string; path: string; files: { name: string; path: string; is_dir: boolean; size: number }[] }>('open_workspace', { path });

    const root: FileNode = {
      name: info.name,
      type: 'folder',
      path: info.path,
      children: info.files.map((f) => ({
        name: f.name,
        type: f.is_dir ? 'folder' as const : 'file' as const,
        path: f.path,
        children: f.is_dir ? [] as FileNode[] : undefined,
      })),
    };

    useEditorStore.setState((s) => ({
      workspace: {
        ...s.workspace,
        path: info.path,
        name: info.name,
        fileTree: [root],
      },
    }));
    localStorage.setItem('gost-workspace-path', info.path);
    store.addRecentProject(info.path);
  } catch (e) {
    console.error('Failed to open recent workspace:', e);
  }
}
