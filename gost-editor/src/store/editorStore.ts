import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

export type LeftTab = 'project' | 'search' | 'git' | 'structure';

export interface Tab {
  id: string;
  name: string;
  path: string;
  language: string;
  dirty: boolean;
}

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path?: string;
  children?: FileNode[];
  gitStatus?: 'M' | 'A' | 'D';
  modified?: boolean;
  active?: boolean;
}

export interface Problem {
  type: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  action?: string;
}

export interface CursorPosition {
  line: number;
  col: number;
}

interface TabState {
  items: Tab[];
  activeId: string | null;
  dirty: Set<string>;
}

interface EditorStore {
  saveFileAs: () => Promise<void>;
  newWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  workspace: {
    path: string;
    name: string;
    gitBranch: string;
    gitChanges: number;
    fileTree: FileNode[];
  };
  tabs: TabState;
  editor: {
    cursor: CursorPosition;
    selected: number;
  };
  fileContents: Record<string, string>;
  panels: {
    leftOpen: boolean;
    leftTab: LeftTab;
    rightOpen: boolean;
    terminalOpen: boolean;
    terminalHeight: number;
  };
  problems: Problem[];
  settings: {
    fontSize: number;
    tabSize: number;
    fontFamily: string;
    theme: 'dark' | 'light';
    autoSave: boolean;
  };

  setWorkspace: (path: string, name: string) => void;
  expandDir: (folderPath: string) => Promise<void>;
  openFile: (filePath: string, fileName: string) => Promise<void>;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setFileContent: (filePath: string, content: string) => void;
  saveFile: (filePath: string) => Promise<void>;
  setCursor: (cursor: CursorPosition) => void;
  persistPanels: (panels: Partial<EditorStore['panels']>) => void;
  setLeftOpen: (open: boolean) => void;
  setLeftTab: (tab: LeftTab) => void;
  setRightOpen: (open: boolean) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  setProblems: (problems: Problem[]) => void;
  setSettings: (settings: Partial<EditorStore['settings']>) => void;
  toggleTheme: () => void;
  recentProjects: string[];
  createFile: (parentPath: string, name: string) => Promise<void>;
  createFolder: (parentPath: string, name: string) => Promise<void>;
  renameItem: (oldPath: string, newName: string) => Promise<void>;
  deleteItem: (itemPath: string) => Promise<void>;
  newFile: () => void;
  newGostTemplate: (name: string) => void;
  newGoTemplate: (name: string) => void;
  saveAll: () => Promise<void>;
  addRecentProject: (path: string) => void;
}

function getFileExt(path: string) {
  return path.split('.').pop()?.toLowerCase() || '';
}

const langFromExt: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', go: 'go', mod: 'text', sum: 'text',
  html: 'html', css: 'css', json: 'json',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', bmp: 'image',
  ico: 'image', svg: 'image', webp: 'image',
};

const imageMime: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  bmp: 'image/bmp', ico: 'image/x-icon', svg: 'image/svg+xml', webp: 'image/webp',
};

export const useEditorStore = create<EditorStore>((set) => ({
  workspace: {
    path: '',
    name: '',
    gitBranch: '',
    gitChanges: 0,
    fileTree: [],
  },
  tabs: {
    items: [],
    activeId: null,
    dirty: new Set<string>(),
  },
  editor: {
    cursor: { line: 1, col: 1 },
    selected: 0,
  },
  fileContents: {},
  recentProjects: JSON.parse(localStorage.getItem('gost-recent-projects') || '[]'),
  panels: (() => {
    const saved = localStorage.getItem('gost-panels');
    if (saved) {
      try { return { leftOpen: true, leftTab: 'project', rightOpen: true, terminalOpen: true, terminalHeight: 140, ...JSON.parse(saved) }; }
      catch {}
    }
    return { leftOpen: true, leftTab: 'project', rightOpen: true, terminalOpen: true, terminalHeight: 140 };
  })(),
  problems: [],
  settings: {
    fontSize: 13,
    tabSize: 2,
    fontFamily: 'JetBrains Mono',
    theme: (localStorage.getItem('gost-theme') as 'dark' | 'light') || 'dark',
    autoSave: true,
  },

  setWorkspace: (path, name) =>
    set((state) => ({
      workspace: { ...state.workspace, path, name, fileTree: state.workspace.fileTree },
    })),

  expandDir: async (folderPath: string) => {
    try {
      const entries = await invoke<{ name: string; path: string; is_dir: boolean }[]>('list_dir', { path: folderPath });
      const children: FileNode[] = entries.map((e) => ({
        name: e.name,
        type: e.is_dir ? 'folder' : 'file',
        path: e.path,
        children: e.is_dir ? [] : undefined,
      }));
      const normalized = folderPath.replace(/\\/g, '/');
      let found = false;
      set((state) => {
        const replaceNode = (nodes: FileNode[]): FileNode[] =>
          nodes.map((n) => {
            const nNorm = (n.path ?? '').replace(/\\/g, '/');
            if (nNorm === normalized) { found = true; return { ...n, children }; }
            if (n.children) return { ...n, children: replaceNode(n.children) };
            return n;
          });
        return { workspace: { ...state.workspace, fileTree: replaceNode(state.workspace.fileTree) } };
      });
      if (!found) console.warn('expandDir: no node matched path', normalized, 'in fileTree');
    } catch (e) {
      console.error('Failed to expand directory:', folderPath, e);
    }
  },

  openFile: async (filePath: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const language = langFromExt[ext] || 'text';
    let content: string;
    if (language === 'image') {
      const b64 = await invoke<string>('read_file_base64', { path: filePath });
      const mime = imageMime[ext] || 'image/png';
      content = `data:${mime};base64,${b64}`;
    } else {
      content = await invoke<string>('read_file', { path: filePath });
    }
    const tab: Tab = { id: filePath, name: fileName, path: filePath, language, dirty: false };
    set((state) => {
      const exists = state.tabs.items.find((t) => t.id === filePath);
      const items = exists ? state.tabs.items : [...state.tabs.items, tab];
      return { tabs: { items, activeId: filePath, dirty: state.tabs.dirty }, fileContents: { ...state.fileContents, [filePath]: content } };
    });
  },

  setFileContent: (filePath: string, content: string) =>
    set((state) => {
      const dirty = new Set(state.tabs.dirty);
      dirty.add(filePath);
      return { fileContents: { ...state.fileContents, [filePath]: content }, tabs: { ...state.tabs, dirty } };
    }),

  saveFile: async (filePath: string) => {
    const state = useEditorStore.getState();
    const content = state.fileContents[filePath];
    if (!content) return;
    const tab = state.tabs.items.find((t) => t.id === filePath);
    if (tab) {
      const ext = tab.path.split('.').pop()?.toLowerCase();
      if (ext === 'go') {
        try {
          const { runShell, runGoCheck } = await import('./editorCommands');
          await runShell('go', ['fmt', tab.path]);
          await runGoCheck(tab.path);
        } catch {}
      }
      if (ext === 'ts' || ext === 'tsx') {
        try {
          const { runShell } = await import('./editorCommands');
          await runShell('npx', ['prettier', '--write', tab.path]);
        } catch {}
      }
    }
    await invoke('write_file', { path: filePath, content });
    set((state) => {
      const dirty = new Set(state.tabs.dirty);
      dirty.delete(filePath);
      return { tabs: { ...state.tabs, dirty } };
    });
  },

  saveFileAs: async () => {
    const state = useEditorStore.getState();
    const activeId = state.tabs.activeId;
    if (!activeId) return;
    const content = state.fileContents[activeId];
    const currentTab = state.tabs.items.find((t) => t.id === activeId);

    const newPath = await save({
      title: 'Save File As',
      defaultPath: currentTab?.name,
      filters: [
        { name: 'TypeScript', extensions: ['ts', 'tsx'] },
        { name: 'Go', extensions: ['go', 'mod', 'sum'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'CSS', extensions: ['css'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (!newPath) return;

    await invoke('write_file', { path: newPath, content });
    const name = newPath.split('\\').pop()?.split('/').pop() || newPath;
    const ext2 = getFileExt(name);
    const language = langFromExt[ext2] || 'text';

    set((state) => {
      const items = state.tabs.items.map((t) =>
        t.id === activeId
          ? { ...t, id: newPath, name, path: newPath, language }
          : t
      );
      const fileContents = { ...state.fileContents };
      fileContents[newPath] = content;
      delete fileContents[activeId];
      const dirty = new Set(state.tabs.dirty);
      dirty.delete(activeId);
      return { tabs: { items, activeId: newPath, dirty }, fileContents };
    });
  },

  newWindow: async () => {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const label = 'Gost-' + Date.now();
    const win = new WebviewWindow(label, {
      url: '/',
      title: 'Gost Editor',
      width: 1480,
      height: 900,
      minWidth: 900,
      minHeight: 600,
      center: true,
      decorations: false,
    });
    win.once('tauri://error', (e) => {
      console.error('New window failed:', e);
    });
  },

  closeWindow: async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  },

  closeTab: (id: string) =>
    set((state) => {
      const items = state.tabs.items.filter((t) => t.id !== id);
      const wasActive = state.tabs.activeId === id;
      const newActiveId = wasActive
        ? items.length > 0
          ? items[items.length - 1].id
          : null
        : state.tabs.activeId;
      const dirty = new Set(state.tabs.dirty);
      dirty.delete(id);
      const fileContents = { ...state.fileContents };
      delete fileContents[id];
      return {
        tabs: { items, activeId: newActiveId, dirty },
        fileContents,
      };
    }),

  setActiveTab: (id: string) =>
    set((state) => ({
      tabs: { ...state.tabs, activeId: id },
    })),

  setCursor: (cursor: CursorPosition) =>
    set((state) => ({
      editor: { ...state.editor, cursor },
    })),

  persistPanels: (panels: Partial<EditorStore['panels']>) =>
    set((state) => {
      const updated = { ...state.panels, ...panels };
      localStorage.setItem('gost-panels', JSON.stringify(updated));
      return { panels: updated };
    }),

  setLeftOpen: (open: boolean) =>
    set((state) => {
      const updated = { ...state.panels, leftOpen: open };
      localStorage.setItem('gost-panels', JSON.stringify(updated));
      return { panels: updated };
    }),

  setLeftTab: (tab: LeftTab) =>
    set((state) => {
      const updated = { ...state.panels, leftTab: tab };
      localStorage.setItem('gost-panels', JSON.stringify(updated));
      return { panels: updated };
    }),

  setRightOpen: (open: boolean) =>
    set((state) => {
      const updated = { ...state.panels, rightOpen: open };
      localStorage.setItem('gost-panels', JSON.stringify(updated));
      return { panels: updated };
    }),

  toggleLeft: () =>
    set((state) => {
      const updated = { ...state.panels, leftOpen: !state.panels.leftOpen };
      localStorage.setItem('gost-panels', JSON.stringify(updated));
      return { panels: updated };
    }),

  toggleRight: () =>
    set((state) => {
      const updated = { ...state.panels, rightOpen: !state.panels.rightOpen };
      localStorage.setItem('gost-panels', JSON.stringify(updated));
      return { panels: updated };
    }),

  setProblems: (problems: Problem[]) =>
    set({ problems }),

  setSettings: (settings: Partial<EditorStore['settings']>) =>
    set((state) => {
      const updated = { ...state.settings, ...settings };
      localStorage.setItem('gost-theme', updated.theme);
      return { settings: updated };
    }),

  toggleTheme: () =>
    set((state) => {
      const next = state.settings.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('gost-theme', next);
      return { settings: { ...state.settings, theme: next } };
    }),

  createFile: async (parentPath: string, name: string) => {
    try {
      const newPath = await invoke<string>('create_file', { parentPath, name });
      const parsedName = newPath.split('\\').pop()?.split('/').pop() || name;
      set((state) => {
        const addChild = (nodes: FileNode[]): FileNode[] =>
          nodes.map((n) => {
            if ((n.path ?? '').replace(/\\/g, '/') === parentPath.replace(/\\/g, '/') && n.children) {
              return { ...n, children: [...n.children, { name: parsedName, type: 'file', path: newPath }] };
            }
            if (n.children) return { ...n, children: addChild(n.children) };
            return n;
          });
        return { workspace: { ...state.workspace, fileTree: addChild(state.workspace.fileTree) } };
      });
    } catch (e) {
      console.error('Failed to create file:', e);
    }
  },

  createFolder: async (parentPath: string, name: string) => {
    try {
      const newPath = await invoke<string>('create_folder', { parentPath, name });
      const parsedName = newPath.split('\\').pop()?.split('/').pop() || name;
      set((state) => {
        const addChild = (nodes: FileNode[]): FileNode[] =>
          nodes.map((n) => {
            if ((n.path ?? '').replace(/\\/g, '/') === parentPath.replace(/\\/g, '/') && n.children) {
              return { ...n, children: [...n.children, { name: parsedName, type: 'folder', path: newPath, children: [] }] };
            }
            if (n.children) return { ...n, children: addChild(n.children) };
            return n;
          });
        return { workspace: { ...state.workspace, fileTree: addChild(state.workspace.fileTree) } };
      });
    } catch (e) {
      console.error('Failed to create folder:', e);
    }
  },

  renameItem: async (oldPath: string, newName: string) => {
    try {
      const newPath = await invoke<string>('rename_item', { oldPath, newName });
      const parsedName = newPath.split('\\').pop()?.split('/').pop() || newName;
      set((state) => {
        const normalizedOld = oldPath.replace(/\\/g, '/');

        const renameInTree = (nodes: FileNode[]): FileNode[] =>
          nodes.map((n) => {
            const nPath = (n.path ?? '').replace(/\\/g, '/');
            if (nPath === normalizedOld) return { ...n, name: parsedName, path: newPath };
            if (n.children) return { ...n, children: renameInTree(n.children) };
            return n;
          });

        const tabs = state.tabs;
        const items = tabs.items.map((t) => {
          if (t.id.replace(/\\/g, '/') === normalizedOld) {
            return { ...t, id: newPath, name: parsedName, path: newPath };
          }
          return t;
        });
        const activeId = tabs.activeId?.replace(/\\/g, '/') === normalizedOld ? newPath : tabs.activeId;

        const fileContents = { ...state.fileContents };
        if (fileContents[oldPath] !== undefined) {
          fileContents[newPath] = fileContents[oldPath];
          delete fileContents[oldPath];
        }

        const dirty = new Set(state.tabs.dirty);
        if (dirty.has(oldPath)) {
          dirty.delete(oldPath);
          dirty.add(newPath);
        }

        return {
          workspace: { ...state.workspace, fileTree: renameInTree(state.workspace.fileTree) },
          tabs: { items, activeId, dirty },
          fileContents,
        };
      });
    } catch (e) {
      console.error('Failed to rename item:', e);
    }
  },

  deleteItem: async (itemPath: string) => {
    try {
      await invoke('delete_item', { path: itemPath });
      set((state) => {
        const normalizedPath = itemPath.replace(/\\/g, '/');

        const removeFromTree = (nodes: FileNode[]): FileNode[] =>
          nodes.flatMap((n) => {
            if ((n.path ?? '').replace(/\\/g, '/') === normalizedPath) return [];
            if (n.children) return [{ ...n, children: removeFromTree(n.children) }];
            return [n];
          });

        const items = state.tabs.items.filter((t) => t.id.replace(/\\/g, '/') !== normalizedPath);
        const wasActive = state.tabs.activeId?.replace(/\\/g, '/') === normalizedPath;
        const newActiveId = wasActive
          ? items.length > 0 ? items[items.length - 1].id : null
          : state.tabs.activeId;

        const dirty = new Set(state.tabs.dirty);
        dirty.delete(itemPath);

        const fileContents = { ...state.fileContents };
        delete fileContents[itemPath];

        return {
          workspace: { ...state.workspace, fileTree: removeFromTree(state.workspace.fileTree) },
          tabs: { items, activeId: newActiveId, dirty },
          fileContents,
        };
      });
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  },

  newFile: () => set((state) => {
    const count = state.tabs.items.filter((t) => t.id.startsWith('untitled:')).length + 1;
    const id = `untitled:${count}`;
    const tab: Tab = { id, name: `Untitled-${count}`, path: id, language: 'text', dirty: true };
    const dirty = new Set(state.tabs.dirty);
    dirty.add(id);
    return {
      tabs: { items: [...state.tabs.items, tab], activeId: id, dirty },
      fileContents: { ...state.fileContents, [id]: '' },
    };
  }),

  newGostTemplate: (name: string) => set((state) => {
    const tsContent = `// ${name}.ts\n// Gost component\n\nexport function ${name}() {\n  return \`<div class="${name.toLowerCase()}">\n    <h1>${name}</h1>\n  </div>\`;\n}\n`;
    const htmlContent = `<!-- ${name}.html -->\n<div class="${name.toLowerCase()}">\n  <h1>${name}</h1>\n</div>\n`;
    const cssContent = `/* ${name}.css */\n.${name.toLowerCase()} {\n  padding: 1rem;\n}\n`;
    const dirty = new Set(state.tabs.dirty);
    const items = [...state.tabs.items];
    const fileContents = { ...state.fileContents };
    let count = state.tabs.items.filter((t) => t.id.startsWith('untitled:')).length + 1;
    for (const [filename, content] of [['.ts', tsContent], ['.html', htmlContent], ['.css', cssContent]] as const) {
      const id = `untitled:${count}`;
      const tab: Tab = { id, name: `${name}${filename}`, path: id, language: filename.slice(1), dirty: true };
      items.push(tab);
      dirty.add(id);
      fileContents[id] = content;
      count++;
    }
    return { tabs: { items, activeId: items[items.length - 1]?.id ?? null, dirty }, fileContents };
  }),

  newGoTemplate: (name: string) => set((state) => {
    const content = `package ${name.toLowerCase()}\n\nfunc New() string {\n  return "${name}"\n}\n`;
    const count = state.tabs.items.filter((t) => t.id.startsWith('untitled:')).length + 1;
    const id = `untitled:${count}`;
    const tab: Tab = { id, name: `${name}.go`, path: id, language: 'go', dirty: true };
    const dirty = new Set(state.tabs.dirty);
    dirty.add(id);
    return {
      tabs: { items: [...state.tabs.items, tab], activeId: id, dirty },
      fileContents: { ...state.fileContents, [id]: content },
    };
  }),

  saveAll: async () => {
    const state = useEditorStore.getState();
    const dirtyPaths = [...state.tabs.dirty];
    await Promise.all(dirtyPaths.map((p) => {
      if (!p.startsWith('untitled:')) return state.saveFile(p);
      return Promise.resolve();
    }));
  },

  addRecentProject: (path: string) => set((state) => {
    const filtered = state.recentProjects.filter((p) => p !== path);
    const updated = [path, ...filtered].slice(0, 10);
    localStorage.setItem('gost-recent-projects', JSON.stringify(updated));
    return { recentProjects: updated };
  }),
}));