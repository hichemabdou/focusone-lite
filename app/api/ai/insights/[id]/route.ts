import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !["active", "dismissed", "acted"].includes(status)) {
        return NextResponse.json(
            { error: "Invalid status. Must be: active, dismissed, or acted" },
            { status: 400 }
        );
    }

    const updateData: any = { status };
    if (status === "dismissed") {
        updateData.dismissed_at = new Date().toISOString();
    } else if (status === "acted") {
        updateData.acted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from("ai_insights")
        .update(updateData)
        .eq("id", params.id)
        .eq("user_id", session.user.id) // Ensure user owns this insight
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    return NextResponse.json(data);
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
        .from("ai_insights")
        .delete()
        .eq("id", params.id)
        .eq("user_id", session.user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
