import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

// POST /api/goals/[id]/comments - Add a comment to a goal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
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

    // Verify goal belongs to user
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingGoal || existingGoal.user_id !== user.id) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Create comment
    const { data: newComment, error } = await supabase
      .from('goal_comments')
      .insert({
        goal_id: id,
        user_id: user.id,
        text,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals/[id]/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
