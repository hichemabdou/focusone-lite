import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", session.user.id)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

    if (status !== "all") {
        query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { insight_type, title, description, action_type, action_payload, priority } = body;

    if (!insight_type || !title) {
        return NextResponse.json(
            { error: "insight_type and title are required" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("ai_insights")
        .insert({
            user_id: session.user.id,
            insight_type,
            title,
            description,
            action_type,
            action_payload,
            priority: priority || 0,
            status: "active",
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
