import { db } from "@/db";
import { step } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

/** Bulk create steps */
export async function POST(request: NextRequest) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { steps: stepsData } = await request.json();
  if (!Array.isArray(stepsData) || stepsData.length === 0) {
    return jsonError("steps array is required");
  }

  const created = await db.insert(step).values(stepsData).returning();

  return NextResponse.json(created, { status: 201 });
}
