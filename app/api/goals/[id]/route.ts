import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

// PATCH /api/goals/[id] - Update a goal
export async function PATCH(
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

    // Update goal
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.milestone !== undefined) updateData.milestone = body.milestone;

    const { data: updatedGoal, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating goal:", error);
      return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
    }

    // Get comments
    const { data: comments } = await supabase
      .from('goal_comments')
      .select('*')
      .eq('goal_id', id)
      .order('timestamp', { ascending: true });

    return NextResponse.json({
      goal: { ...updatedGoal, comments: comments || [] }
    }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/goals/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify goal belongs to user
    const { data: existingGoal } = await supabase
      .from('goals')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingGoal || existingGoal.user_id !== user.id) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Delete goal (comments will be cascade deleted)
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting goal:", error);
      return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
    }

    return NextResponse.json({ message: "Goal deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/goals/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
