
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("groceries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((item) => ({
      ...item,
      isBought: item.is_bought,
    }))
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { error: "Grocery name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("groceries")
      .insert({
        user_id: user.id,
        name: String(body.name).trim(),
        emoji: body.emoji ?? "🛒",
        category: body.category ?? "Other",
        quantity: Number(body.quantity ?? 1),
        unit: body.unit ?? "pcs",
        is_bought: Boolean(body.isBought ?? body.is_bought ?? false),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ...data, isBought: data.is_bought },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
