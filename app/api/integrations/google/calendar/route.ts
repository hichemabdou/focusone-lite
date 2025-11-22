import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listEvents } from "@/lib/googleCalendar";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
        return NextResponse.json({ error: "Missing start or end date" }, { status: 400 });
    }

    try {
        const events = await listEvents((session as any).accessToken, start, end);
        return NextResponse.json({ events });
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}
