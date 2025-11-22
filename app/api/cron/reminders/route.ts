import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
// import nodemailer from "nodemailer"; // Uncomment when configured

export async function GET(request: Request) {
    // This endpoint should be protected by a secret key for Cron jobs
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    // Simple protection (in production use a robust secret from env)
    if (key !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
        // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    try {
        // 1. Fetch all goals with reminders
        // In a real app, we would filter by date in SQL to be efficient
        const { data: goals, error } = await supabase
            .from("goals")
            .select("*, users(email)")
            .not("reminders", "is", null);

        if (error) throw error;

        const now = new Date();
        const sentCount = 0;

        // 2. Iterate and check triggers
        for (const goal of goals || []) {
            const reminders = goal.reminders as any[]; // Type this properly
            if (!Array.isArray(reminders)) continue;

            for (const reminder of reminders) {
                if (reminder.type !== "email") continue;

                // Calculate trigger time
                const endDate = new Date(goal.end_date);
                const triggerTime = new Date(endDate.getTime() - (reminder.offsetMinutes * 60000));

                // Check if we are within a 1-hour window of the trigger time
                // This assumes the cron runs hourly
                const diff = Math.abs(now.getTime() - triggerTime.getTime());
                const isTime = diff < 3600000; // Within 1 hour

                if (isTime) {
                    // Send email
                    console.log(`Sending reminder email to ${goal.users.email} for goal "${goal.title}"`);

                    // Mock email sending
                    // await sendEmail(goal.users.email, goal.title);

                    // sentCount++;
                }
            }
        }

        return NextResponse.json({ success: true, checked: goals?.length, sent: sentCount });
    } catch (error) {
        console.error("Error processing reminders:", error);
        return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
    }
}
