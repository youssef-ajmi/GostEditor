import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, FolderTree, Search } from 'lucide-react';
import TitleBar from './TitleBar';
import MenuBar from './MenuBar';
import StatusBar from './StatusBar';
import FileTree from '../sidebar/FileTree';
import SearchPanel from '../sidebar/SearchPanel';
import EditorArea from '../editor/EditorArea';

import CommandPalette from '../ui/CommandPalette';
import ContextMenu from '../ui/ContextMenu';
import styles from './EditorShell.module.css';
import { useEditorStore } from '../../store/editorStore';
import { executeEditorAction } from '../../store/editorCommands';
import { invoke } from '@tauri-apps/api/core';
import { openFileDialog } from '../../store/openFile';
import { openFolder } from '../../store/openFolder';

export default function EditorShell() {
  const { panels, setLeftOpen, setRightOpen, setLeftTab, toggleLeft } = useEditorStore();
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextAction = useCallback((action: string) => {
    executeEditorAction(action);
  }, []);

  const chordTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === 'b') {
        e.preventDefault();
        toggleLeft();
        return;
      }

      if (mod && e.key === 'o') {
        e.preventDefault();
        if (chordTimer.current) {
          clearTimeout(chordTimer.current);
          chordTimer.current = undefined;
          openFolder();
        } else {
          openFileDialog();
        }
        return;
      }

      if (mod && e.key === 'k') {
        e.preventDefault();
        if (chordTimer.current) clearTimeout(chordTimer.current);
        chordTimer.current = setTimeout(() => { chordTimer.current = undefined; }, 600);
        return;
      }

      if (mod && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        useEditorStore.getState().newWindow();
        return;
      }

      if (mod && !e.shiftKey && e.key === 'n') {
        e.preventDefault();
        useEditorStore.getState().newFile();
        return;
      }

      if (mod && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        useEditorStore.getState().saveFileAs();
        return;
      }

      if (mod && !e.shiftKey && e.key === 's') {
        e.preventDefault();
        const store = useEditorStore.getState();
        if (store.tabs.activeId) store.saveFile(store.tabs.activeId);
        return;
      }

      if (e.ctrlKey && e.key === 'F4') {
        e.preventDefault();
        const store = useEditorStore.getState();
        if (store.tabs.activeId) store.closeTab(store.tabs.activeId);
        return;
      }

      if (chordTimer.current && !mod && e.key !== 'Control' && e.key !== 'Meta') {
        clearTimeout(chordTimer.current);
        chordTimer.current = undefined;
      }
    }
    function handleContext(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-editor-area]')) return;
      e.preventDefault();
      setCtxMenu({ x: e.clientX, y: e.clientY });
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContext);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContext);
    };
  }, [toggleLeft]);

  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const savedPath = localStorage.getItem('gost-workspace-path');
    if (!savedPath) return;

    (async () => {
      try {
        const info = await invoke<{ name: string; path: string; files: { name: string; path: string; is_dir: boolean }[] }>('open_workspace', { path: savedPath });

        const root = {
          name: info.name,
          type: 'folder' as const,
          path: info.path,
          children: info.files.map((f) => ({
            name: f.name,
            type: f.is_dir ? 'folder' as const : 'file' as const,
            path: f.path,
            children: f.is_dir ? [] : undefined,
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
      } catch {
        localStorage.removeItem('gost-workspace-path');
      }
    })();
  }, []);

  const tabs = [
    { id: 'project' as const, icon: FolderTree, label: 'Project' },
    { id: 'search' as const, icon: Search, label: 'Search' },
  ];

  return (
    <div className={styles.editor}>
      <TitleBar />
      <MenuBar />

      <div className={styles.bodyPanel}>
        <div className={`${styles.leftSidebar} ${!panels.leftOpen ? styles.collapsed : ''}`}>
          <button
            className={styles.sidebarToggle}
            onClick={() => setLeftOpen(!panels.leftOpen)}
            title="Toggle Sidebar (Ctrl+B)"
          >
            <ChevronLeft size={10} />
          </button>

          <div className={styles.sidebarTabs}>
            {tabs.map((tab) => (
              <span
                key={tab.id}
                className={`${styles.stab} ${panels.leftTab === tab.id ? styles.active : ''}`}
                onClick={() => setLeftTab(tab.id)}
                title={tab.label || tab.id}
              >
                <tab.icon size={12} />
                {tab.label && <span>{tab.label}</span>}
              </span>
            ))}
          </div>

          {panels.leftTab === 'search' ? (
            <div className={styles.fileTreeContainer}>
              <SearchPanel />
            </div>
          ) : (
            <div className={styles.fileTreeContainer}>
              <FileTree />
            </div>
          )}
        </div>

        <div className={styles.centerEditor}>
          <EditorArea />
        </div>

        {panels.rightOpen && (
          <div className={styles.rightPanel}>
            <button
              className={styles.rightPanelToggle}
              onClick={() => setRightOpen(!panels.rightOpen)}
              title="Toggle Panel"
            >
              <ChevronRight size={10} />
            </button>
          </div>
        )}
      </div>

      <StatusBar />
      <CommandPalette />
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
}
