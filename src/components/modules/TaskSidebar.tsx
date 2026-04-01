'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, PlayCircle, HelpCircle, Layout, Calculator, Layers, Cpu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import styles from './TaskSidebar.module.css';
import type { Task } from '@/lib/types/module';

interface TaskSidebarProps {
  moduleSlug: string;
  tasks: Task[];
  completedTaskIds: string[];
}

const typeIcons: Record<string, any> = {
  tutorial: PlayCircle,
  quiz: HelpCircle,
  lab: Layout,
  calculator: Calculator,
  visualizer: Layers,
  subnetting: Calculator,
  vlsm: Cpu,
};

export default function TaskSidebar({ moduleSlug, tasks, completedTaskIds }: TaskSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Achieve "Maximum Fit" by expanding the global layout
  useEffect(() => {
    const mainArea = document.querySelector('.main-area');
    const mainContent = document.querySelector('.main-content');
    const globalSidebar = document.querySelector('.app-layout > aside'); // Assuming global sidebar is the first aside

    if (mainArea) mainArea.classList.add('no-sidebar');
    if (mainContent) mainContent.classList.add('wide');
    if (globalSidebar) (globalSidebar as HTMLElement).style.display = 'none';

    return () => {
      if (mainArea) mainArea.classList.remove('no-sidebar');
      if (mainContent) mainContent.classList.remove('wide');
      if (globalSidebar) (globalSidebar as HTMLElement).style.display = 'flex';
    };
  }, []);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        {!isCollapsed && <h3 className={styles.title}>Module Tasks</h3>}
        <button 
          className={styles.collapseBtn} 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <div className={styles.taskList}>
        {tasks.map((task) => {
          const Icon = typeIcons[task.type] || Circle;
          const isCompleted = completedTaskIds.includes(task.id);
          const isActive = pathname.includes(`/${task.slug}`);

          return (
            <Link
              key={task.id}
              href={`/modules/${moduleSlug}/${task.slug}`}
              className={`${styles.taskItem} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
              title={isCollapsed ? task.title : undefined}
            >
              <div className={styles.statusIcon}>
                {isCompleted ? (
                  <CheckCircle2 size={18} className={styles.check} />
                ) : (
                  <Icon size={18} />
                )}
              </div>
              {!isCollapsed && (
                <div className={styles.taskInfo}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  <span className={styles.xpReward}>{task.xpReward} XP</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
