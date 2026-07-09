import styles from './Minimap.module.css';

const minimapLines = [
  { type: 'code', width: 65 },
  { type: 'code', width: 70 },
  { type: 'empty', width: 0 },
  { type: 'keyword', width: 80 },
  { type: 'keyword', width: 55 },
  { type: 'empty', width: 0 },
  { type: 'keyword', width: 35 },
  { type: 'code', width: 30 },
  { type: 'code', width: 25 },
  { type: 'code', width: 20 },
  { type: 'code', width: 10 },
  { type: 'empty', width: 0 },
  { type: 'active', width: 70 },
  { type: 'code', width: 55 },
  { type: 'empty', width: 0 },
  { type: 'code', width: 75 },
  { type: 'code', width: 60 },
  { type: 'code', width: 50 },
  { type: 'code', width: 45 },
  { type: 'code', width: 25 },
  { type: 'code', width: 10 },
  { type: 'empty', width: 0 },
  { type: 'keyword', width: 45 },
  { type: 'code', width: 95 },
  { type: 'code', width: 10 },
  { type: 'empty', width: 0 },
  { type: 'string', width: 60 },
];

export default function Minimap() {
  return (
    <div className={styles.minimap}>
      <div className={styles.viewport} />
      <div className={styles.lines}>
        {minimapLines.map((line, i) => (
          <div
            key={i}
            className={`${styles.miniLine} ${styles[line.type]}`}
            style={{ width: `${line.width}%` }}
          />
        ))}
      </div>
    </div>
  );
}