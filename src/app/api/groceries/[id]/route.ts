
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const { id } = await context.params;
  const groceryId = Number(id);

  if (!Number.isInteger(groceryId) || groceryId <= 0) {
    return NextResponse.json({ error: "Invalid grocery ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if ("isBought" in body || "is_bought" in body) {
      updates.is_bought = Boolean(body.isBought ?? body.is_bought);
    }

    if ("name" in body) updates.name = String(body.name).trim();
    if ("emoji" in body) updates.emoji = body.emoji;
    if ("category" in body) updates.category = body.category;
    if ("quantity" in body) updates.quantity = Number(body.quantity);
    if ("unit" in body) updates.unit = body.unit;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("groceries")
      .update(updates)
      .eq("id", groceryId)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Grocery item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ...data, isBought: data.is_bought });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const { id } = await context.params;
  const groceryId = Number(id);

  if (!Number.isInteger(groceryId) || groceryId <= 0) {
    return NextResponse.json({ error: "Invalid grocery ID" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("groceries")
    .delete()
    .eq("id", groceryId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Grocery item not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, id: data.id });
}
