import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type WorkHour = {
    id?: string;
    user_id?: string;
    day_of_week: number;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
};

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("work_hours")
        .select("*")
        .eq("user_id", session.user.id)
        .order("day_of_week", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no work hours exist, return defaults (9-5 Mon-Fri)
    if (!data || data.length === 0) {
        const defaults = Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            start_time: i >= 1 && i <= 5 ? "09:00" : null, // Mon-Fri
            end_time: i >= 1 && i <= 5 ? "17:00" : null,
            is_active: i >= 1 && i <= 5,
        }));
        return NextResponse.json(defaults);
    }

    return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: WorkHour[] = await req.json();

    if (!Array.isArray(body)) {
        return NextResponse.json(
            { error: "Expected array of work hours" },
            { status: 400 }
        );
    }

    // Validate day_of_week values
    const validDays = body.every(
        (wh) => wh.day_of_week >= 0 && wh.day_of_week <= 6
    );
    if (!validDays) {
        return NextResponse.json(
            { error: "Invalid day_of_week value (must be 0-6)" },
            { status: 400 }
        );
    }

    // Delete existing work hours for this user
    await supabase.from("work_hours").delete().eq("user_id", session.user.id);

    // Insert new work hours
    const workHoursToInsert = body.map((wh) => ({
        user_id: session.user.id,
        day_of_week: wh.day_of_week,
        start_time: wh.start_time,
        end_time: wh.end_time,
        is_active: wh.is_active ?? true,
    }));

    const { data, error } = await supabase
        .from("work_hours")
        .insert(workHoursToInsert)
        .select();

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

    const body: WorkHour = await req.json();

    if (body.day_of_week < 0 || body.day_of_week > 6) {
        return NextResponse.json(
            { error: "Invalid day_of_week value (must be 0-6)" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("work_hours")
        .upsert(
            {
                user_id: session.user.id,
                day_of_week: body.day_of_week,
                start_time: body.start_time,
                end_time: body.end_time,
                is_active: body.is_active ?? true,
            },
            {
                onConflict: "user_id,day_of_week",
            }
        )
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
