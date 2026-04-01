'use client';

import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ProgressBar({ progress, size = 'md', showLabel = false }: ProgressBarProps) {
  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={styles.wrapper}>
      {showLabel && (
        <div className={styles.labelRow}>
          <span className={styles.percentage}>{Math.round(percentage)}% Complete</span>
        </div>
      )}
      <div className={`${styles.container} ${styles[size]}`}>
        <div 
          className={styles.bar} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
