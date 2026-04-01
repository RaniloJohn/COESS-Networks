import { getTaskData, getTasksForModule } from '@/lib/mdx';
import { serialize } from 'next-mdx-remote/serialize';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowLeft, X } from 'lucide-react';
import TaskSidebar from '@/components/modules/TaskSidebar';
import MDXRenderer from '@/components/modules/MDXRenderer';
import styles from './page.module.css';

interface TaskPageProps {
  params: {
    slug: string;
    taskSlug: string;
  };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { slug, taskSlug } = await params;
  
  const taskData = await getTaskData(slug, taskSlug);
  const tasks = await getTasksForModule(slug);

  if (!taskData) {
    notFound();
  }

  const { task, content } = taskData;
  const mdxSource = await serialize(content);

  // Find neighboring tasks for navigation
  const currentIndex = tasks.findIndex((t) => t.slug === taskSlug);
  const nextTask = tasks[currentIndex + 1];
  const prevTask = tasks[currentIndex - 1];

  // TODO: Fetch real user completions from Supabase
  const completedTaskIds: string[] = [];

  return (
    <div className={styles.layout}>
      {/* Sidebar Navigation */}
      <TaskSidebar 
        moduleSlug={slug} 
        tasks={tasks} 
        completedTaskIds={completedTaskIds} 
      />

      {/* Main Content Area */}
      <main className={styles.main}>
        <div className={`${styles.container} ${task.type === 'calculator' || task.type === 'lab' ? styles.wideContainer : ''}`}>
          <header className={styles.header}>
            <div className={styles.topNav}>
              <Link href={`/modules/${slug}`} className={styles.backLink}>
                <ArrowLeft size={16} />
                <span>Back to Module</span>
              </Link>
              <div className={styles.taskType}>
                <Link href={`/modules/${slug}`} className={styles.exitButton} title="Exit Task">
                  <X size={20} />
                </Link>
              </div>
            </div>
            
            <h1 className={styles.title}>{task.title}</h1>
          </header>

          <article className={styles.article}>
            <MDXRenderer source={mdxSource} />
          </article>

          <footer className={styles.footer}>
            <div className={styles.navButtons}>
              {prevTask ? (
                <Link href={`/modules/${slug}/${prevTask.slug}`} className={styles.navBtn}>
                  <ChevronLeft size={18} />
                  <span>Previous</span>
                </Link>
              ) : <div />}

              <button className={styles.completeBtn}>
                <CheckCircle2 size={18} />
                <span>Mark as Complete</span>
              </button>

              {nextTask ? (
                <Link href={`/modules/${slug}/${nextTask.slug}`} className={styles.navBtn}>
                  <span>Next</span>
                  <ChevronRight size={18} />
                </Link>
              ) : <div />}
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
