# Fix: Deep Folder Expansion + Editor Theme

## Issue 1: Deep folder expansion

### Problem
When navigating deeper into folders, files/subfolders inside don't appear. `expandDir` has no error handling — if `invoke('list_dir')` throws, the error propagates uncaught through `handleFolderClick`, `setLoading(false)` and `setOpen(!open)` never run, and the folder stays collapsed/loading. Also there's a stale closure issue with `handleFolderClick` capturing `node`/`open` across the async boundary. Rapid double-clicks can cause race conditions.

### Files to change

#### `src/components/sidebar/FileTree.tsx`
1. Add `useRef` import
2. Add `loadingRef = useRef(false)` guard inside `TreeItem`
3. Rewrite `handleFolderClick`:
   - Check `loadingRef.current` before proceeding
   - Set `loadingRef.current = true` before `setLoading(true)`
   - `try { await expandDir(node.path) }` then `setOpen(!open)`
   - `finally { setLoading(false); loadingRef.current = false }`

#### `src/store/editorStore.ts`
4. Wrap `expandDir` body in `try/catch`:
   - `try { ... } catch (e) { console.error('Failed to expand dir:', folderPath, e) }`
   - On error, do NOT update the store (folder stays collapsed)

---

## Issue 2: Editor theme incompatible with app theme

### Problem
Editor uses hardcoded GoLand/Darcula colors (`#2B2B2B` bg, `#A9B7C6` text, `#CC7832` orange keywords) while app uses purple-dark palette (`--bg-primary: #141422`, `--text-primary: #e8e8f8`, `--purple-accent: #bc8cff`). Editor background `#2B2B2B` clashes with app `--bg-primary: #141422`.

### File to change

#### `src/components/editor/CodeEditor.tsx`
Replace hardcoded GoLand colors in `golandTheme` and `golandHighlight` with CSS variables:

| Element | Old (GoLand) | New (CSS var) |
|---|---|---|
| Editor bg | `#2B2B2B` | `var(--bg-primary)` |
| Text | `#A9B7C6` | `var(--text-primary)` |
| Gutter bg | `#313335` | `var(--bg-secondary)` |
| Gutter text | `#606366` | `var(--text-dim)` |
| Active line gutter | `#313335` / `#A9B7C6` | `var(--bg-secondary)` / `var(--text-secondary)` |
| Selection bg | `#214283` | `var(--purple-glow-strong)` |
| Active line bg | `rgba(255,255,255,.03)` | `var(--purple-glow)` |
| Cursor | `#BBBBBB` | `var(--text-primary)` |
| Matching bracket | `rgba(255,255,255,.1)` / `rgba(255,255,255,.2)` | `var(--purple-glow)` / `var(--purple-glow-strong)` |
| Non-matching bracket | `rgba(255,87,87,.2)` | `rgba(255,123,114,.2)` |
| Keywords | `#CC7832` (orange) | `var(--purple-accent)` (`#bc8cff`) |
| Strings | `#6A8759` (green) | `var(--green-accent)` (`#3fb950`) |
| Comments | `#808080` | `var(--text-dim)` (`#4a4a6a`) |
| Functions | `#FFC66D` (yellow) | `var(--blue-accent)` (`#58a6ff`) |
| Types/Classes | `#FFC66D` | `var(--yellow-accent)` (`#ffbd2e`) |
| Numbers | `#6897BB` | `var(--cyan-accent)` (`#56d4dd`) |
| Operators/Punctuation | `#A9B7C6` | `var(--text-secondary)` |
| Booleans | `#CC7832` | `var(--purple-accent)` |
| Tag names | `#CC7832` | `var(--purple-accent)` |
| Attribute names | `#BBBBBB` | `var(--text-secondary)` |
| Doc strings | `#629755` | `var(--text-dim)` |
| Namespace | `#6897BB` | `var(--cyan-accent)` |

---

## Verification
```powershell
npm run build   # should pass with no errors
```
