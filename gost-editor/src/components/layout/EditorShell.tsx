import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, FolderTree, Search, GitBranch, GitFork } from 'lucide-react';
import TitleBar from './TitleBar';
import MenuBar from './MenuBar';
import StatusBar from './StatusBar';
import FileTree from '../sidebar/FileTree';
import EditorArea from '../editor/EditorArea';
import RightPanel from '../panels/RightPanel';
import CommandPalette from '../ui/CommandPalette';
import styles from './EditorShell.module.css';
import { useEditorStore } from '../../store/editorStore';

export default function EditorShell() {
  const { panels, setLeftOpen, setRightOpen, setLeftTab, toggleLeft } = useEditorStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleLeft();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeft]);

  const tabs = [
    { id: 'project' as const, icon: FolderTree, label: 'Project' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'git' as const, icon: GitBranch, label: 'Git' },
    { id: 'structure' as const, icon: GitFork, label: '' },
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

          <div className={styles.sidebarSearch}>
            <Search size={11} />
            <input type="text" placeholder="Search files..." aria-label="Search files" />
          </div>

          <div className={styles.fileTreeContainer}>
            <FileTree />
          </div>
        </div>

        <div className={styles.centerEditor}>
          <EditorArea />
        </div>

        <div className={`${styles.rightPanel} ${!panels.rightOpen ? styles.collapsed : ''}`}>
          <button
            className={styles.rightPanelToggle}
            onClick={() => setRightOpen(!panels.rightOpen)}
            title="Toggle Panel"
          >
            <ChevronRight size={10} />
          </button>
          <RightPanel />
        </div>
      </div>

      <StatusBar />
      <CommandPalette />
    </div>
  );
}