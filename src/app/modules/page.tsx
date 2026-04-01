import { getAllModules } from '@/lib/mdx';
import ModuleCard from '@/components/modules/ModuleCard';
import { BookOpen, Trophy, Target } from 'lucide-react';
import styles from './page.module.css';

export const metadata = {
  title: 'Learning Modules — COESS Networks',
  description: 'Explore our comprehensive networking curriculum. All modules are unlocked and free to learn at your own pace.',
};

export default async function ModulesPage() {
  const modules = await getAllModules();
  
  // TODO: Fetch real user progress from Supabase
  // Mock progress for UI demonstration
  const mockProgress = (moduleId: string) => ({
    moduleId,
    totalTasks: 4,
    completedTasks: moduleId === 'networking-basics' ? 1 : 0,
    earnedXp: moduleId === 'networking-basics' ? 10 : 0,
    totalXp: 40,
    percentComplete: moduleId === 'networking-basics' ? 25 : 0,
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>Learning Modules</h1>
          <p className={styles.subtitle}>
            Master networking step-by-step from fundamental theory to complex subnetting.
          </p>
        </div>
        
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <BookOpen size={20} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{modules.length}</span>
              <span className={styles.statLabel}>Modules Available</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <Trophy size={20} className={styles.statIconPurple} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>10</span>
              <span className={styles.statLabel}>XP Earned</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <Target size={20} className={styles.statIconCyan} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>1 / 24</span>
              <span className={styles.statLabel}>Tasks Completed</span>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        {modules.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            progress={mockProgress(module.slug)} 
          />
        ))}
        
        {/* Empty States for future modules */}
        {[...Array(3)].map((_, i) => (
          <div key={`empty-${i}`} className={styles.emptyCard}>
            <span className={styles.comingSoon}>COMING SOON</span>
            <div className={styles.emptyIcon} />
            <div className={styles.emptyLineShort} />
            <div className={styles.emptyLineLong} />
          </div>
        ))}
      </div>
    </div>
  );
}
