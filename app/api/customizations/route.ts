import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

// GET /api/customizations - Get all customizations for the authenticated user
export async function GET(request: NextRequest) {
  try {
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

    // Get all customizations
    const { data: customizations, error } = await supabase
      .from('customizations')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error fetching customizations:", error);
      return NextResponse.json({ error: "Failed to fetch customizations" }, { status: 500 });
    }

    // Format response
    const response: any = {};
    customizations.forEach(item => {
      response[item.type] = item.data;
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("GET /api/customizations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/customizations - Update customizations
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Type and data are required" },
        { status: 400 }
      );
    }

    if (!['categories', 'priorities', 'statuses'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid customization type" },
        { status: 400 }
      );
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

    // Upsert customization
    const { data: updatedCustomization, error } = await supabase
      .from('customizations')
      .upsert({
        user_id: user.id,
        type,
        data,
      }, {
        onConflict: 'user_id,type'
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating customization:", error);
      return NextResponse.json({ error: "Failed to update customization" }, { status: 500 });
    }

    return NextResponse.json({ customization: updatedCustomization }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/customizations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
