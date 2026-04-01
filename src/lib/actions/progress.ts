'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeTask(moduleId: string, taskId: string) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'You must be signed in to save progress.' };
  }

  const { error } = await supabase
    .from('task_completions')
    .upsert({
      user_id: user.id,
      module_id: moduleId,
      task_id: taskId,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id, task_id'
    });

  if (error) {
    console.error('Error completing task:', error);
    return { error: 'Failed to save progress.' };
  }

  // Revalidate the module and grid pages
  revalidatePath(`/modules/${moduleId}`);
  revalidatePath('/modules');
  
  return { success: true };
}
