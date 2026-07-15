import { useRef, useEffect, useCallback } from 'react';
import styles from './Minimap.module.css';
import { useEditorStore } from '../../store/editorStore';
import { activeView } from '../../store/editorCommands';

const LINE_HEIGHT = 3;
const LINE_GAP = 1;

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeId = useEditorStore((s) => s.tabs.activeId);
  const fileContents = useEditorStore((s) => s.fileContents);
  const content = activeId ? fileContents[activeId] ?? '' : '';
  const isDragging = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    const w = rect?.width ?? 60;
    const h = rect?.height ?? 400;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'var(--bg-secondary)';
    ctx.fillRect(0, 0, w, h);

    if (!content) return;

    const lines = content.split('\n');
    const step = LINE_HEIGHT + LINE_GAP;
    const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
    const barWidth = Math.max(w - 12, 4);

    for (let i = 0; i < lines.length; i++) {
      const y = 4 + i * step;
      if (y > h - 4) break;
      const line = lines[i];
      const len = line.length;
      if (len === 0) continue;

      const pct = len / maxLineLen;
      const bw = Math.max(2, barWidth * pct);
      const trimmed = line.trimStart();
      let color = 'var(--text-dim)';
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--') || trimmed.startsWith('/*')) {
        color = 'var(--green-accent)';
      } else if (trimmed.startsWith('import') || trimmed.startsWith('function') || trimmed.startsWith('const') || trimmed.startsWith('let') || trimmed.startsWith('var') || trimmed.startsWith('class') || trimmed.startsWith('interface') || trimmed.startsWith('type') || trimmed.startsWith('enum') || trimmed.startsWith('pub') || trimmed.startsWith('fn') || trimmed.startsWith('def') || trimmed.startsWith('if') || trimmed.startsWith('for') || trimmed.startsWith('while') || trimmed.startsWith('return') || trimmed.startsWith('switch') || trimmed.startsWith('match')) {
        color = 'var(--accent)';
      } else if (trimmed.startsWith('"') || trimmed.startsWith("'") || trimmed.startsWith('`')) {
        color = 'var(--yellow-accent)';
      }

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(6, y, bw, LINE_HEIGHT);
      ctx.globalAlpha = 1;
    }

    if (activeView) {
      const scrollDom = activeView.scrollDOM;
      const scrollTop = scrollDom.scrollTop;
      const scrollHeight = scrollDom.scrollHeight;
      const clientHeight = scrollDom.clientHeight;
      if (scrollHeight > 0) {
        const vpTop = 4 + (scrollTop / scrollHeight) * (h - 8);
        const vpHeight = (clientHeight / scrollHeight) * (h - 8);
        ctx.fillStyle = 'rgba(188, 140, 255, 0.06)';
        ctx.fillRect(2, vpTop, w - 4, vpHeight);
        ctx.strokeStyle = 'rgba(188, 140, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(2, vpTop, w - 4, vpHeight);
      }
    }
  }, [content]);

  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    const canvas = canvasRef.current;
    if (canvas?.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    if (!activeView) return;
    const dom = activeView.scrollDOM;
    const handler = () => draw();
    dom.addEventListener('scroll', handler);
    return () => dom.removeEventListener('scroll', handler);
  }, [activeView, draw]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!activeView) return;
    isDragging.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const h = rect.height;
    const scrollDom = activeView.scrollDOM;
    const scrollHeight = scrollDom.scrollHeight;
    const clientHeight = scrollDom.clientHeight;
    const ratio = (e.clientY - rect.top) / h;
    scrollDom.scrollTop = ratio * (scrollHeight - clientHeight);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const r = canvas.getBoundingClientRect();
      const y = Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height));
      scrollDom.scrollTop = y * (scrollHeight - clientHeight);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [activeView]);

  return (
    <div className={styles.minimap}>
      <canvas ref={canvasRef} onMouseDown={handleMouseDown} />
    </div>
  );
}