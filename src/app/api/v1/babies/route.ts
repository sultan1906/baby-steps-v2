import { db } from "@/db";
import { baby, step } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { currentBabyCookieConfig } from "@/lib/baby-utils";
import { listAccessibleBabies } from "@/lib/baby-access";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/** List all babies the current user can access (owned + co-parented) */
export async function GET() {
  const { session, error } = await getApiSession();
  if (error) return error;

  const babies = await listAccessibleBabies(session.user.id);
  return NextResponse.json(babies);
}

/** Create a new baby */
export async function POST(request: NextRequest) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const data = await request.json();
  if (!data.name || !data.birthdate) {
    return jsonError("name and birthdate are required");
  }

  const babyId = crypto.randomUUID();

  const [[[newBaby]], cookieStore] = await Promise.all([
    db.batch([
      db
        .insert(baby)
        .values({
          id: babyId,
          userId: session.user.id,
          name: data.name,
          birthdate: data.birthdate,
          photoUrl: data.photoUrl,
        })
        .returning(),
      // Auto-create "Arrival" milestone step
      db.insert(step).values({
        babyId,
        date: data.birthdate,
        isMajor: true,
        type: "milestone",
        title: "Arrival",
        caption: "The journey begins today.",
      }),
    ]),
    cookies(),
  ]);

  // Set current baby cookie
  const { name, value, options } = currentBabyCookieConfig(newBaby.id);
  cookieStore.set(name, value, options);

  return NextResponse.json(newBaby, { status: 201 });
}
