import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

// GET /api/goals - List all goals for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all goals for the user
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error);
      return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
    }

    // Get comments for all goals
    const goalIds = goals.map(g => g.id);
    let comments: any[] = [];

    if (goalIds.length > 0) {
      const { data: commentsData } = await supabase
        .from('goal_comments')
        .select('*')
        .in('goal_id', goalIds)
        .order('timestamp', { ascending: true });

      comments = commentsData || [];
    }

    // Attach comments to goals
    const goalsWithComments = goals.map(goal => ({
      ...goal,
      comments: comments.filter(c => c.goal_id === goal.id)
    }));

    return NextResponse.json({ goals: goalsWithComments }, { status: 200 });
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, startDate, endDate, category, priority, status, notes, milestone } = body;

    if (!title || !startDate || !endDate || !category || !priority || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create goal
    const { data: newGoal, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title,
        start_date: startDate,
        end_date: endDate,
        category,
        priority,
        status,
        notes: notes || null,
        milestone: milestone || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating goal:", error);
      return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
    }

    return NextResponse.json({ goal: { ...newGoal, comments: [] } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
