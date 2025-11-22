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

    const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

    if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no preferences exist, create defaults
    if (!data) {
        const { data: newPrefs, error: createError } = await supabase
            .from("user_preferences")
            .insert({
                user_id: session.user.id,
                theme: "dark",
                start_of_week: 1,
                notifications_enabled: true,
                email_notifications: true,
                google_calendar_sync: false,
                ai_suggestions_enabled: true,
                auto_prioritization: false,
                auto_scheduling: false,
            })
            .select()
            .single();

        if (createError) {
            return NextResponse.json(
                { error: createError.message },
                { status: 500 }
            );
        }

        return NextResponse.json(newPrefs);
    }

    return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Remove sensitive fields that shouldn't be directly updated
    const {
        user_id,
        created_at,
        updated_at,
        google_refresh_token,
        google_access_token,
        ...updateFields
    } = body;

    const { data, error } = await supabase
        .from("user_preferences")
        .upsert(
            {
                user_id: session.user.id,
                ...updateFields,
            },
            {
                onConflict: "user_id",
            }
        )
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Remove fields that shouldn't be updated
    const { user_id, created_at, updated_at, ...updateFields } = body;

    const { data, error } = await supabase
        .from("user_preferences")
        .update(updateFields)
        .eq("user_id", session.user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
