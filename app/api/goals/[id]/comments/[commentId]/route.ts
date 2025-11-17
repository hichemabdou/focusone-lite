import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

// DELETE /api/goals/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
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

    // Verify comment belongs to user
    const { data: existingComment } = await supabase
      .from('goal_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!existingComment || existingComment.user_id !== user.id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Delete comment
    const { error } = await supabase
      .from('goal_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return NextResponse.json({ message: "Comment deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/goals/[id]/comments/[commentId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
