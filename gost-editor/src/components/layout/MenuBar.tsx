import { useState, useRef, useEffect } from 'react';
import {
  FileCode, Pen, Eye, Navigation, Code, Terminal, Wrench, Puzzle, HelpCircle,
  ChevronDown, ChevronRight, FolderOpen, File, History, Save, ToggleLeft, X,
  Undo, Redo, Scissors, Copy, Clipboard, Search
} from 'lucide-react';
import styles from './MenuBar.module.css';
import { openFolder, openRecentFolder } from '../../store/openFolder';
import { openFileDialog } from '../../store/openFile';
import { useEditorStore } from '../../store/editorStore';
import { executeEditorAction } from '../../store/editorCommands';

const menus = [
  { icon: FileCode, label: 'File' },
  { icon: Pen, label: 'Edit' },
  { icon: Eye, label: 'View' },
  { icon: Navigation, label: 'Navigate' },
  { icon: Code, label: 'Code' },
  { icon: Terminal, label: 'Terminal' },
  { icon: Wrench, label: 'Tools' },
  { icon: Puzzle, label: 'Plugins' },
  { icon: HelpCircle, label: 'Help' },
];

interface MenuItem {
  label?: string;
  icon?: typeof File;
  shortcut?: string;
  action?: () => void;
  type?: 'separator' | 'toggle';
  checked?: boolean;
  submenu?: { label: string; action: () => void }[];
}

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const autoSave = useEditorStore((s) => s.settings.autoSave);
  const recentProjects = useEditorStore((s) => s.recentProjects);
  const activeId = useEditorStore((s) => s.tabs.activeId);
  const newFile = useEditorStore((s) => s.newFile);
  const saveFile = useEditorStore((s) => s.saveFile);
  const saveFileAs = useEditorStore((s) => s.saveFileAs);
  const newWindow = useEditorStore((s) => s.newWindow);
  const closeWindow = useEditorStore((s) => s.closeWindow);
  const setSettings = useEditorStore((s) => s.setSettings);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setOpenSubmenu(null);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const close = () => { setOpenMenu(null); setOpenSubmenu(null); };

  const fileMenuItems: MenuItem[] = [
    { icon: File, label: 'New File', shortcut: 'Ctrl+N', action: () => { newFile(); close(); } },
    { icon: File, label: 'New Window', shortcut: 'Ctrl+Shift+N', action: () => { newWindow(); close(); } },
    { type: 'separator' },
    { icon: File, label: 'Open File...', shortcut: 'Ctrl+O', action: () => { openFileDialog(); close(); } },
    { icon: FolderOpen, label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: () => { openFolder(); close(); } },
    {
      icon: History, label: 'Open Recent', shortcut: '',
      submenu: recentProjects.length > 0
        ? recentProjects.map((p) => ({ label: p, action: () => { openRecentFolder(p); close(); } }))
        : [{ label: '(empty)', action: () => {} }],
    },
    { type: 'separator' },
    { icon: Save, label: 'Save', shortcut: 'Ctrl+S', action: () => { if (activeId) saveFile(activeId); close(); } },
    { icon: Save, label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => { saveFileAs(); close(); } },
    { type: 'separator' },
    { icon: ToggleLeft, label: 'Auto Save', type: 'toggle', checked: autoSave, action: () => { setSettings({ autoSave: !autoSave }); close(); } },
    { type: 'separator' },
    { icon: X, label: 'Close Window', action: () => { closeWindow(); close(); } },
  ];

  const editMenuItems: MenuItem[] = [
    { icon: Undo, label: 'Undo', shortcut: 'Ctrl+Z', action: () => { executeEditorAction('undo'); close(); } },
    { icon: Redo, label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => { executeEditorAction('redo'); close(); } },
    { type: 'separator' },
    { icon: Scissors, label: 'Cut', shortcut: 'Ctrl+X', action: () => { executeEditorAction('cut'); close(); } },
    { icon: Copy, label: 'Copy', shortcut: 'Ctrl+C', action: () => { executeEditorAction('copy'); close(); } },
    { icon: Clipboard, label: 'Paste', shortcut: 'Ctrl+V', action: () => { executeEditorAction('paste'); close(); } },
    { type: 'separator' },
    { icon: Search, label: 'Find', shortcut: 'Ctrl+F', action: () => { executeEditorAction('find'); close(); } },
  ];

  function renderItems(items: MenuItem[]) {
    return items.map((item, i) => {
      if (item.type === 'separator') {
        return <div key={i} className={styles.menuSeparator} />;
      }
      if (item.submenu && item.label) {
        const label: string = item.label;
        const isOpen = openSubmenu === label;
        return (
          <div
            key={label}
            className={styles.menuDropdownItem}
            onMouseEnter={() => setOpenSubmenu(label)}
            onMouseLeave={() => setOpenSubmenu(null)}
            onClick={() => { setOpenSubmenu(isOpen ? null : label); }}
          >
            {item.icon && <item.icon size={12} />}
            <span>{item.label}</span>
            <ChevronRight size={10} className={styles.submenuArrow} />
            {isOpen && (
              <div className={styles.submenu}>
                {item.submenu.map((sub, j) => (
                  <div
                    key={j}
                    className={styles.submenuItem}
                    onClick={(e) => { e.stopPropagation(); sub.action(); }}
                  >
                    {sub.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      if (item.type === 'toggle' && item.label) {
        return (
          <div key={item.label} className={styles.menuDropdownItem} onClick={() => item.action?.()}>
            <span className={styles.toggleBox}>{item.checked ? '✓' : ''}</span>
            <span>{item.label}</span>
          </div>
        );
      }
      if (item.label) {
        return (
          <div key={item.label} className={styles.menuDropdownItem} onClick={() => item.action?.()}>
            {item.icon && <item.icon size={12} />}
            <span>{item.label}</span>
            {item.shortcut && <span className={styles.menuShortcut}>{item.shortcut}</span>}
          </div>
        );
      }
      return null;
    });
  }

  return (
    <div className={styles.menuBar} ref={ref}>
      {menus.map((menu) => (
        <div key={menu.label} className={styles.menuWrapper}>
          <span
            className={`${styles.menuItem} ${openMenu === menu.label ? styles.menuActive : ''}`}
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
          >
            <menu.icon size={13} />
            {menu.label}
            <ChevronDown size={8} className={styles.dropdownArrow} />
          </span>
          {openMenu === menu.label && menu.label === 'File' && (
            <div className={styles.menuDropdown}>{renderItems(fileMenuItems)}</div>
          )}
          {openMenu === menu.label && menu.label === 'Edit' && (
            <div className={styles.menuDropdown}>{renderItems(editMenuItems)}</div>
          )}
        </div>
      ))}
      <span className={styles.menuRight}>
        <span className={styles.versionBadge}>v0.9.2</span>
      </span>
    </div>
  );
}
