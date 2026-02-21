import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { input, sessionToken } = await request.json();

  // Graceful degradation when no API key is configured
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ suggestions: [] });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
      Referer: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    },
    body: JSON.stringify({ input, sessionToken }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { suggestions: [], error: data.error?.message ?? "Places API error" },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
