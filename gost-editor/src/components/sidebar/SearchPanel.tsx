import { useState, useRef, useCallback } from 'react';
import { Search, X, FileCode, ChevronRight, Loader } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useEditorStore } from '../../store/editorStore';
import styles from './SearchPanel.module.css';

interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
}

interface GroupedResults {
  [file: string]: SearchResult[];
}

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspace = useEditorStore((s) => s.workspace);
  const openFile = useEditorStore((s) => s.openFile);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !workspace.path) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await invoke<SearchResult[]>('search_files', { path: workspace.path, query: q });
      setResults(res);
      setExpanded(new Set(res.map((r) => r.file)));
    } catch (e) {
      console.error('Search failed:', e);
    }
    setSearching(false);
  }, [workspace.path]);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 300);
  }, [doSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (timerRef.current) clearTimeout(timerRef.current);
      doSearch(query);
    }
  }, [doSearch, query]);

  const toggleFile = useCallback((file: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  }, []);

  const fileName = (path: string) => path.split('\\').pop()?.split('/').pop() || path;

  const grouped: GroupedResults = {};
  for (const r of results) {
    if (!grouped[r.file]) grouped[r.file] = [];
    grouped[r.file].push(r);
  }

  return (
    <div className={styles.searchPanel}>
      <div className={styles.searchInputWrap}>
        <Search size={12} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search in workspace..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search in workspace"
          autoFocus
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => { setQuery(''); setResults([]); }}>
            <X size={10} />
          </button>
        )}
      </div>

      {searching && (
        <div className={styles.status}>
          <Loader size={12} className={styles.spin} /> Searching...
        </div>
      )}

      {!searching && query && results.length === 0 && (
        <div className={styles.status}>No results found</div>
      )}

      <div className={styles.results}>
        {Object.entries(grouped).map(([file, matches]) => (
          <div key={file}>
            <div className={styles.fileGroup} onClick={() => toggleFile(file)}>
              <ChevronRight size={10} className={`${styles.chevron} ${expanded.has(file) ? styles.open : ''}`} />
              <FileCode size={11} />
              <span className={styles.fileName}>{fileName(file)}</span>
              <span className={styles.matchCount}>{matches.length}</span>
            </div>
            {expanded.has(file) && matches.map((m, i) => (
              <div
                key={`${file}-${i}`}
                className={styles.matchLine}
                onClick={() => openFile(m.file, fileName(m.file))}
              >
                <span className={styles.lineNum}>{m.line}</span>
                <span className={styles.matchText}>{m.text}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}