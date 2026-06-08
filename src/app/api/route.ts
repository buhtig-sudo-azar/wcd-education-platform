import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Hello, world!" },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}