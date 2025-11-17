import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name: name || email.split('@')[0],
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating user:", insertError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create default customizations
    const defaultCategories = [
      { name: "STRATEGY", color: "#8b5cf6" },
      { name: "VISION", color: "#3b82f6" },
      { name: "TACTICAL", color: "#10b981" },
      { name: "PROJECT", color: "#f59e0b" },
      { name: "DAILY", color: "#ef4444" }
    ];

    const defaultPriorities = [
      { name: "low", color: "#6b7280" },
      { name: "medium", color: "#f59e0b" },
      { name: "high", color: "#ef4444" },
      { name: "critical", color: "#dc2626" }
    ];

    const defaultStatuses = [
      { name: "open", color: "#6b7280" },
      { name: "in-progress", color: "#3b82f6" },
      { name: "blocked", color: "#ef4444" },
      { name: "done", color: "#10b981" }
    ];

    await supabase.from('customizations').insert([
      { user_id: newUser.id, type: 'categories', data: defaultCategories },
      { user_id: newUser.id, type: 'priorities', data: defaultPriorities },
      { user_id: newUser.id, type: 'statuses', data: defaultStatuses }
    ]);

    return NextResponse.json(
      { message: "User created successfully", user: { id: newUser.id, email: newUser.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
