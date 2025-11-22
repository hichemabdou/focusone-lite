import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createEvent, updateEvent, deleteEvent } from "@/lib/googleCalendar";
import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goalId, title, startDate, endDate, notes, googleEventId, shouldSync } = await request.json();

    if (!goalId) {
        return NextResponse.json({ error: "Missing goalId" }, { status: 400 });
    }

    const accessToken = (session as any).accessToken;
    const supabase = getServiceSupabase();

    try {
        let newGoogleEventId = googleEventId;

        if (shouldSync) {
            const eventData = {
                summary: title,
                description: notes,
                start: { date: startDate }, // All-day event
                end: { date: endDate },     // All-day event
            };

            if (googleEventId) {
                // Update existing event
                await updateEvent(accessToken, googleEventId, eventData);
            } else {
                // Create new event
                const newEvent = await createEvent(accessToken, eventData);
                if (newEvent) {
                    newGoogleEventId = newEvent.id;
                }
            }
        } else if (googleEventId && !shouldSync) {
            // Delete event if sync is turned off
            await deleteEvent(accessToken, googleEventId);
            newGoogleEventId = null;
        }

        // Update goal in DB with new googleEventId
        if (newGoogleEventId !== googleEventId) {
            await supabase
                .from("goals")
                .update({ google_event_id: newGoogleEventId })
                .eq("id", goalId);
        }

        return NextResponse.json({ success: true, googleEventId: newGoogleEventId });
    } catch (error) {
        console.error("Error syncing to Google Calendar:", error);
        return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
    }
}
