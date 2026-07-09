import { FileCode, Pen, Eye, Navigation, Code, Terminal, Wrench, Puzzle, HelpCircle, ChevronDown } from 'lucide-react';
import styles from './MenuBar.module.css';

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

export default function MenuBar() {
  return (
    <div className={styles.menuBar}>
      {menus.map((menu) => (
        <span key={menu.label} className={styles.menuItem}>
          <menu.icon size={13} />
          {menu.label}
          <ChevronDown size={8} className={styles.dropdownArrow} />
        </span>
      ))}
      <span className={styles.menuRight}>
        <span className={styles.versionBadge}>v0.9.2</span>
      </span>
    </div>
  );
}