import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, FileCode, FileJson, FileText } from 'lucide-react';
import styles from './FileTree.module.css';

interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  gitStatus?: 'M' | 'A' | 'D';
  modified?: boolean;
  active?: boolean;
}

const mockFiles: TreeNode[] = [
  {
    name: 'my-app', type: 'folder', children: [
      {
        name: '.gost', type: 'folder', children: [
          {
            name: 'generated', type: 'folder', children: [
              { name: 'api.ts', type: 'file', gitStatus: 'M' },
            ],
          },
          {
            name: 'runtime', type: 'folder', children: [
              { name: 'reactive.ts', type: 'file' },
              { name: 'template.ts', type: 'file' },
            ],
          },
        ],
      },
      {
        name: 'backend', type: 'folder', children: [
          { name: 'main.go', type: 'file' },
          { name: 'ws.go', type: 'file', gitStatus: 'A' },
        ],
      },
      {
        name: 'frontend', type: 'folder', children: [
          { name: 'app.ts', type: 'file', modified: true, gitStatus: 'M', active: true },
          { name: 'app.html', type: 'file' },
          {
            name: 'styles', type: 'folder', children: [
              { name: 'app.css', type: 'file' },
            ],
          },
        ],
      },
      { name: 'go.mod', type: 'file' },
      { name: 'package.json', type: 'file' },
      { name: 'tsconfig.json', type: 'file' },
    ],
  },
];

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

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;
  const indent = depth * 16;

  if (node.type === 'folder') {
    const fileIcon = open
      ? <FolderOpen size={14} style={{ color: 'var(--blue-accent)' }} />
      : <Folder size={14} style={{ color: 'var(--blue-accent)' }} />;

    return (
      <>
        <div
          className={styles.treeItem}
          style={{ paddingLeft: 8 + indent }}
          onClick={() => setOpen(!open)}
        >
          <span className={`${styles.chevron} ${open ? styles.open : ''}`}>
            <ChevronRight size={9} />
          </span>
          <span className={styles.fileIcon}>{fileIcon}</span>
          <span className={styles.fileName}>{node.name}</span>
        </div>
        {hasChildren && (
          <div className={`${styles.folderChildren} ${!open ? styles.folded : ''}`}>
            {node.children!.map((child) => (
              <TreeItem key={child.name} node={child} depth={depth + 1} />
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
    >
      <span className={styles.chevronHidden} />
      <span className={styles.fileIcon}>{getFileIcon(node.name)}</span>
      <span className={styles.fileName}>{node.name}</span>
      {node.modified && <span className={styles.modifiedDot} />}
      {node.gitStatus && (
        <span className={`${styles.gitStatus} ${node.gitStatus === 'M' ? styles.modified : styles.added}`}>
          {node.gitStatus}
        </span>
      )}
    </div>
  );
}

export default function FileTree() {
  return (
    <div className={styles.fileTree}>
      {mockFiles.map((node) => (
        <TreeItem key={node.name} node={node} />
      ))}
    </div>
  );
}