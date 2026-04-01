'use client';

import Link from 'next/link';
import { 
  ChevronRight, 
  Globe, 
  Layers, 
  Binary, 
  Calculator, 
  BookOpen,
  Cpu
} from 'lucide-react';
import ProgressBar from './ProgressBar';
import styles from './ModuleCard.module.css';
import type { Module, ModuleProgress } from '@/lib/types/module';

interface ModuleCardProps {
  module: Module;
  progress: ModuleProgress;
}

const ICON_MAP: Record<string, any> = {
  Globe: Globe,
  Layers: Layers,
  Binary: Calculator, // Symmetrical fix
  Calculator: Calculator,
  Network: Calculator, // Symmetrical fix
};

const SLUG_ICON_OVERRIDE: Record<string, any> = {
  'networking-basics': Globe,
  'osi-model': Layers,
  'subnetting': Calculator,
  'vlsm': Cpu, // Cpu is symmetrical top-down
};

export default function ModuleCard({ module, progress }: ModuleCardProps) {
  // Try slug override first, then metadata icon, finally fallback
  const IconComponent = SLUG_ICON_OVERRIDE[module.slug] || ICON_MAP[module.icon] || BookOpen;

  const difficultyColors = {
    beginner: styles.beginner,
    intermediate: styles.intermediate,
    advanced: styles.advanced,
  };

  return (
    <Link href={`/modules/${module.slug}`} className={styles.card}>
      <div className={styles.header}>
        <div className={`${styles.iconWrapper} ${difficultyColors[module.difficulty]}`}>
          <IconComponent size={24} />
        </div>
        <div className={styles.badgeRow}>
          <span className={`${styles.difficultyBadge} ${difficultyColors[module.difficulty]}`}>
            {module.difficulty.toUpperCase()}
          </span>
          {progress.percentComplete === 100 && (
            <span className={styles.completedBadge}>COMPLETED</span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{module.title}</h3>
        <p className={styles.description}>{module.description}</p>
      </div>

      <div className={styles.footer}>
        <div className={styles.progressInfo}>
          <ProgressBar progress={progress.percentComplete} size="sm" />
          <div className={styles.stats}>
            <span>{progress.completedTasks} / {progress.totalTasks} Tasks</span>
            <span className={styles.xp}>{progress.earnedXp} / {progress.totalXp} XP</span>
          </div>
        </div>
        <div className={styles.action}>
          <ChevronRight size={18} />
        </div>
      </div>
    </Link>
  );
}
