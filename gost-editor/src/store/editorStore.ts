import { create } from 'zustand';

export type LeftTab = 'project' | 'search' | 'git' | 'structure';

export interface Tab {
  id: string;
  name: string;
  path: string;
  language: string;
  dirty: boolean;
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
  workspace: {
    path: string;
    name: string;
    gitBranch: string;
    gitChanges: number;
  };
  tabs: TabState;
  editor: {
    cursor: CursorPosition;
    selected: number;
  };
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
    theme: 'dark';
  };

  setWorkspace: (path: string, name: string) => void;
  openTab: (tab: Tab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setCursor: (cursor: CursorPosition) => void;
  setLeftOpen: (open: boolean) => void;
  setLeftTab: (tab: LeftTab) => void;
  setRightOpen: (open: boolean) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  setProblems: (problems: Problem[]) => void;
  setSettings: (settings: Partial<EditorStore['settings']>) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  workspace: {
    path: '',
    name: 'my-app',
    gitBranch: 'main',
    gitChanges: 2,
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
  panels: {
    leftOpen: true,
    leftTab: 'project',
    rightOpen: true,
    terminalOpen: true,
    terminalHeight: 140,
  },
  problems: [],
  settings: {
    fontSize: 13,
    tabSize: 2,
    fontFamily: 'JetBrains Mono',
    theme: 'dark',
  },

  setWorkspace: (path, name) =>
    set((state) => ({
      workspace: { ...state.workspace, path, name },
    })),

  openTab: (tab: Tab) =>
    set((state) => {
      const exists = state.tabs.items.find((t) => t.id === tab.id);
      if (exists) {
        return { tabs: { ...state.tabs, activeId: tab.id } };
      }
      return {
        tabs: {
          items: [...state.tabs.items, tab],
          activeId: tab.id,
          dirty: state.tabs.dirty,
        },
      };
    }),

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
      return {
        tabs: { items, activeId: newActiveId, dirty },
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

  setLeftOpen: (open: boolean) =>
    set((state) => ({
      panels: { ...state.panels, leftOpen: open },
    })),

  setLeftTab: (tab: LeftTab) =>
    set((state) => ({
      panels: { ...state.panels, leftTab: tab },
    })),

  setRightOpen: (open: boolean) =>
    set((state) => ({
      panels: { ...state.panels, rightOpen: open },
    })),

  toggleLeft: () =>
    set((state) => ({
      panels: { ...state.panels, leftOpen: !state.panels.leftOpen },
    })),

  toggleRight: () =>
    set((state) => ({
      panels: { ...state.panels, rightOpen: !state.panels.rightOpen },
    })),

  setProblems: (problems: Problem[]) =>
    set({ problems }),

  setSettings: (settings: Partial<EditorStore['settings']>) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),
}));