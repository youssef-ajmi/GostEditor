import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Folder, FolderOpen, FileCode, FileJson, FileText, FolderPlus, FilePlus, Trash, Edit3, Clipboard } from 'lucide-react';
import styles from './FileTree.module.css';
import { useEditorStore, FileNode } from '../../store/editorStore';
import { openFolder } from '../../store/openFolder';

const iconsMap: Record<string, React.ReactNode> = {
  ts: <FileCode size={14} style={{ color: '#3178c6' }} />,
  js: <FileCode size={14} style={{ color: '#f0db4f' }} />,
  go: <FileCode size={14} style={{ color: '#00add8' }} />,
  html: <FileCode size={14} style={{ color: '#e34c26' }} />,
  css: <FileCode size={14} style={{ color: '#563d7c' }} />,
  json: <FileJson size={14} style={{ color: '#f0883e' }} />,
  mod: <FileCode size={14} style={{ color: '#00add8' }} />,
  md: <FileText size={14} style={{ color: '#58a6ff' }} />,
  file: <FileCode size={14} style={{ color: 'var(--text-muted)' }} />,
};

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  return iconsMap[ext as keyof typeof iconsMap] || iconsMap.file;
}

interface CtxMenuState {
  x: number;
  y: number;
  node: FileNode;
}

function TreeItem({ node, depth = 0, onContextMenu }: { node: FileNode; depth?: number; onContextMenu: (e: React.MouseEvent, node: FileNode) => void }) {
  const [open, setOpen] = useState(depth < 1);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const expandDir = useEditorStore((s) => s.expandDir);
  const openFile = useEditorStore((s) => s.openFile);
  const hasChildren = node.type === 'folder' && node.children !== undefined;
  const indent = depth * 16;

  useEffect(() => () => { mountedRef.current = false; }, []);

  const prevChildrenLen = useRef(node.children?.length ?? 0);
  useEffect(() => {
    if (node.children && node.children.length > prevChildrenLen.current) {
      setOpen(true);
    }
    prevChildrenLen.current = node.children?.length ?? 0;
  }, [node.children?.length]);

  if (node.type === 'folder') {
    const fileIcon = open
      ? <FolderOpen size={14} style={{ color: 'var(--blue-accent)' }} />
      : <Folder size={14} style={{ color: 'var(--blue-accent)' }} />;

    function handleFolderClick() {
      if (loadingRef.current) return;
      if (!open && node.path) {
        if (node.children && node.children.length > 0) {
          setOpen(true);
        } else {
          loadingRef.current = true;
          setOpen(true);
          setLoading(true);
          expandDir(node.path).finally(() => {
            if (!mountedRef.current) return;
            setLoading(false);
            loadingRef.current = false;
          });
        }
      } else {
        setOpen(!open);
      }
    }

    return (
      <>
        <div
          className={styles.treeItem}
          style={{ paddingLeft: 8 + indent }}
          onClick={handleFolderClick}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}
        >
          <span className={`${styles.chevron} ${open ? styles.open : ''} ${loading ? styles.loading : ''}`}>
            <ChevronRight size={9} />
          </span>
          <span className={styles.fileIcon}>{fileIcon}</span>
          <span className={styles.fileName}>{node.name}</span>
        </div>
        {hasChildren && open && (
          <div>
            {node.children!.map((child) => (
              <TreeItem key={child.name} node={child} depth={depth + 1} onContextMenu={onContextMenu} />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`${styles.treeItem} ${node.active ? styles.active : ''}`}
      style={{ paddingLeft: 8 + indent }}
      onClick={() => node.path && openFile(node.path, node.name)}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}
    >
      <span className={styles.chevronHidden} />
      <span className={styles.fileIcon}>{getFileIcon(node.name)}</span>
      <span className={styles.fileName}>{node.name}</span>
      {node.modified && <span className={styles.modifiedDot} />}
    </div>
  );
}

export default function FileTree() {
  const workspace = useEditorStore((s) => s.workspace);
  const createFile = useEditorStore((s) => s.createFile);
  const createFolder = useEditorStore((s) => s.createFolder);
  const renameItem = useEditorStore((s) => s.renameItem);
  const deleteItem = useEditorStore((s) => s.deleteItem);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCtxMenu(null);
    }
    if (ctxMenu) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
      return () => {
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('keydown', handleKey);
      };
    }
  }, [ctxMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const closeMenu = useCallback(() => setCtxMenu(null), []);

  const handleNewFile = useCallback(() => {
    if (!ctxMenu) return;
    const name = window.prompt('Enter file name:');
    if (!name || !ctxMenu.node.path) return;
    createFile(ctxMenu.node.path, name);
    closeMenu();
  }, [ctxMenu, createFile, closeMenu]);

  const handleNewFolder = useCallback(() => {
    if (!ctxMenu) return;
    const name = window.prompt('Enter folder name:');
    if (!name || !ctxMenu.node.path) return;
    createFolder(ctxMenu.node.path, name);
    closeMenu();
  }, [ctxMenu, createFolder, closeMenu]);

  const handleRename = useCallback(() => {
    if (!ctxMenu) return;
    const newName = window.prompt('Enter new name:', ctxMenu.node.name);
    if (!newName || newName === ctxMenu.node.name || !ctxMenu.node.path) return;
    renameItem(ctxMenu.node.path, newName);
    closeMenu();
  }, [ctxMenu, renameItem, closeMenu]);

  const handleDelete = useCallback(() => {
    if (!ctxMenu) return;
    if (!window.confirm(`Delete "${ctxMenu.node.name}"?`)) return;
    if (!ctxMenu.node.path) return;
    deleteItem(ctxMenu.node.path);
    closeMenu();
  }, [ctxMenu, deleteItem, closeMenu]);

  const handleCopyPath = useCallback(() => {
    if (!ctxMenu || !ctxMenu.node.path) return;
    navigator.clipboard.writeText(ctxMenu.node.path);
    closeMenu();
  }, [ctxMenu, closeMenu]);

  if (!workspace.fileTree?.length) {
    return (
      <div className={styles.fileTree}>
        <div className={styles.emptyState}>
          <FolderPlus size={32} />
          <span>No project open</span>
          <span>Open a folder to browse files</span>
          <button className={styles.emptyAction} onClick={openFolder}>Open Folder</button>
        </div>
      </div>
    );
  }

  const isFolder = ctxMenu?.node.type === 'folder';

  return (
    <div className={styles.fileTree}>
      {workspace.fileTree.map((node: FileNode) => (
        <TreeItem key={node.name} node={node} onContextMenu={handleContextMenu} />
      ))}

      {ctxMenu && (
        <div
          ref={menuRef}
          className={styles.ctxMenu}
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          {isFolder && (
            <>
              <div className={styles.ctxItem} onClick={handleNewFile}>
                <FilePlus size={12} /> New File
              </div>
              <div className={styles.ctxItem} onClick={handleNewFolder}>
                <FolderPlus size={12} /> New Folder
              </div>
              <div className={styles.ctxSep} />
            </>
          )}
          <div className={styles.ctxItem} onClick={handleRename}>
            <Edit3 size={12} /> Rename
          </div>
          <div className={styles.ctxItem} onClick={handleCopyPath}>
            <Clipboard size={12} /> Copy Path
          </div>
          <div className={styles.ctxSep} />
          <div className={styles.ctxItem} onClick={handleDelete} style={{ color: 'var(--red-accent)' }}>
            <Trash size={12} /> Delete
          </div>
        </div>
      )}
    </div>
  );
}