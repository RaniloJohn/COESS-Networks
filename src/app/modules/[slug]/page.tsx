import { getModuleBySlug, getTasksForModule } from '@/lib/mdx';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { ChevronRight, PlayCircle, Clock, Trophy, Target } from 'lucide-react';
import styles from './page.module.css';

interface ModulePageProps {
  params: {
    slug: string;
  };
}

export default async function ModuleDetailPage({ params }: ModulePageProps) {
  const { slug } = await params;
  const module = await getModuleBySlug(slug);
  const tasks = await getTasksForModule(slug);

  if (!module) {
    notFound();
  }

  const IconComponent = (LucideIcons as any)[module.icon] || LucideIcons.BookOpen;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/modules" className={styles.breadcrumbLink}>Modules</Link>
          <ChevronRight size={14} />
          <span className={styles.breadcrumbCurrent}>{module.title}</span>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={`${styles.iconWrapper} ${styles[module.difficulty]}`}>
              <IconComponent size={32} />
            </div>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>{module.title}</h1>
              <p className={styles.description}>{module.description}</p>
            </div>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Difficulty</span>
              <span className={`${styles.difficultyBadge} ${styles[module.difficulty]}`}>
                {module.difficulty.toUpperCase()}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Tasks</span>
              <span className={styles.metaValue}>{tasks.length}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Total XP</span>
              <span className={styles.metaValuePurple}>{module.totalXp}</span>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Course Content</h2>
        <span className={styles.sectionBadge}>{tasks.length} TASKS</span>
      </div>

      <div className={styles.taskList}>
        {tasks.map((task, index) => (
          <Link 
            key={task.id} 
            href={`/modules/${module.slug}/${task.slug}`}
            className={styles.taskCard}
          >
            <div className={styles.taskNumber}>{index + 1}</div>
            <div className={styles.taskInfo}>
              <h3 className={styles.taskTitle}>{task.title}</h3>
              <p className={styles.taskDesc}>{task.description}</p>
            </div>
            <div className={styles.taskMeta}>
              <div className={styles.typeBadge}>
                {task.type.toUpperCase()}
              </div>
              <div className={styles.xpBadge}>
                +{task.xpReward} XP
              </div>
              <div className={styles.startBtn}>
                <PlayCircle size={18} />
                <span>Start</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
