/* ============================================
   Module Types — Learning Paths & Task Tracking
   ============================================ */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type TaskType = 'tutorial' | 'calculator' | 'lab' | 'visualizer' | 'quiz';

/** A learning module (e.g., "Subnetting", "OSI Model") */
export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  orderIndex: number;
  difficulty: Difficulty;
  totalXp: number;
}

/** A task within a module */
export interface Task {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  description: string;
  type: TaskType;
  xpReward: number;
  orderIndex: number;
  contentMeta: Record<string, unknown>;
}

/** User's progress on a specific module */
export interface ModuleProgress {
  moduleId: string;
  totalTasks: number;
  completedTasks: number;
  earnedXp: number;
  totalXp: number;
  percentComplete: number;
}

/** A completed task record */
export interface TaskCompletion {
  id: string;
  userId: string;
  taskId: string;
  xpEarned: number;
  answerData: Record<string, unknown>;
  completedAt: string;
}

/** User profile with XP stats */
export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  updatedAt: string;
}
