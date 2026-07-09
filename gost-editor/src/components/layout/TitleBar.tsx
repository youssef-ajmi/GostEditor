import { useState, useRef, useEffect } from 'react';
import { Box, GitBranch, Bell, Search, Cog, User } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import styles from './TitleBar.module.css';

export default function TitleBar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className={styles.titleBar} data-tauri-drag-region>
      <div className={styles.windowControls}>
        <button className={`${styles.dot} ${styles.close}`} title="Close" onClick={() => appWindow.close()} />
        <button className={`${styles.dot} ${styles.minimize}`} title="Minimize" onClick={() => appWindow.minimize()} />
        <button className={`${styles.dot} ${styles.maximize}`} title="Maximize" onClick={() => appWindow.toggleMaximize()} />
      </div>

      <div className={styles.brand}>
        <Box size={17} />
        Gost
      </div>

      <div className={styles.projectName} title="Switch project">
        <FolderOpenIcon />
        my-app
        <span className={styles.branch}>
          <GitBranch size={11} />
          main
        </span>
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} title="Notifications (3)">
          <Bell size={14} />
          <span className={styles.badgeCount}>3</span>
        </button>
        <button className={styles.actionBtn} title="Search Everywhere (Ctrl+P)">
          <Search size={14} />
        </button>
        <button className={styles.actionBtn} title="Git">
          <GitBranch size={14} />
        </button>
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <button
            className={styles.actionBtn}
            title="Settings"
            onClick={(e) => { e.stopPropagation(); setProfileOpen(false); setSettingsOpen(!settingsOpen); }}
          >
            <Cog size={14} />
          </button>
          {settingsOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dmItem}><Cog size={12} /> Settings</div>
              <div className={styles.dmItem}><Search size={12} /> Preferences</div>
              <div className={styles.dmItem}><span className={styles.dmIcon}>⌨</span> Keymap</div>
              <div className={styles.dmSep} />
              <div className={styles.dmItem}><span className={styles.dmIcon}>🧩</span> Plugins</div>
              <div className={styles.dmItem}><span className={styles.dmIcon}>🏪</span> Extensions</div>
              <div className={styles.dmSep} />
              <div className={styles.dmItem}><span className={styles.dmIcon}>ℹ</span> About Gost</div>
            </div>
          )}
        </div>
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            className={`${styles.actionBtn} ${styles.profileBtn}`}
            title="Profile"
            onClick={(e) => { e.stopPropagation(); setSettingsOpen(false); setProfileOpen(!profileOpen); }}
          >
            Z
          </button>
          {profileOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dmItem}><User size={12} /> Z Developer</div>
              <div className={styles.dmItem}><span className={styles.dmIcon}>✉</span> z@example.com</div>
              <div className={styles.dmSep} />
              <div className={styles.dmItem}><Cog size={12} /> Account Settings</div>
              <div className={styles.dmItem}><span className={styles.dmIcon}>🚪</span> Sign Out</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FolderOpenIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--blue-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11Z" />
    </svg>
  );
}