import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Module, Task, Difficulty, TaskType } from './types/module';

const MODULES_PATH = path.join(process.cwd(), 'src/content/modules');

/** Get all modules from the filesystem */
export async function getAllModules(): Promise<Module[]> {
  const moduleDirs = fs.readdirSync(MODULES_PATH);
  
  const modules = moduleDirs
    .map((dir) => {
      const configPath = path.join(MODULES_PATH, dir, 'module.json');
      if (!fs.existsSync(configPath)) return null;

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return {
        ...config,
        slug: dir,
      } as Module;
    })
    .filter((m): m is Module => m !== null)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return modules;
}

/** Get a single module by slug */
export async function getModuleBySlug(slug: string): Promise<Module | null> {
  const configPath = path.join(MODULES_PATH, slug, 'module.json');
  if (!fs.existsSync(configPath)) return null;

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return {
    ...config,
    slug,
  } as Module;
}

/** Get all tasks for a specific module */
export async function getTasksForModule(moduleSlug: string): Promise<Task[]> {
  const moduleDir = path.join(MODULES_PATH, moduleSlug);
  if (!fs.existsSync(moduleDir)) return [];

  const files = fs.readdirSync(moduleDir).filter((f) => f.endsWith('.mdx'));
  
  const tasks = files.map((file) => {
    const filePath = path.join(moduleDir, file);
    const source = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(source);

    return {
      id: data.id,
      moduleId: moduleSlug,
      slug: file.replace('.mdx', ''),
      title: data.title,
      description: data.description || '',
      type: data.type as TaskType,
      xpReward: data.xpReward || 10,
      orderIndex: data.orderIndex || 0,
      contentMeta: data.contentMeta || {},
    } as Task;
  });

  return tasks.sort((a, b) => a.orderIndex - b.orderIndex);
}

/** Get task details and MDX source */
export async function getTaskData(moduleSlug: string, taskSlug: string) {
  const filePath = path.join(MODULES_PATH, moduleSlug, `${taskSlug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const source = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(source);

  const task = {
    id: data.id,
    moduleId: moduleSlug,
    slug: taskSlug,
    title: data.title,
    description: data.description || '',
    type: data.type as TaskType,
    xpReward: data.xpReward || 10,
    orderIndex: data.orderIndex || 0,
    contentMeta: data.contentMeta || {},
  } as Task;

  return {
    task,
    content,
    frontmatter: data,
  };
}
