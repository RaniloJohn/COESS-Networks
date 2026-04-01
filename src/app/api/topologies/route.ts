import { createClient } from '@/lib/supabase/server';
import { topologySchema } from '@/lib/types/topology';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    // 1. Validate with Zod
    const validatedData = topologySchema.parse(body);

    // 2. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Upsert to Supabase
    const { data, error } = await supabase
      .from('topologies')
      .upsert({
        user_id: user.id,
        name: validatedData.metadata.name,
        data: validatedData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, name' })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Topology Save Error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('topologies')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ topologies: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
