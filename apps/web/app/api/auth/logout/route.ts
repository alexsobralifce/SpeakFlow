import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

  // Clear the cookie
  response.cookies.set("speakflow_session", "", {
    httpOnly: true,
    expires: new Date(0), // Expire immediately
    path: "/",
  });

  return response;
}
