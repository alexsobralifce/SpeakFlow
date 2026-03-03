import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev");

async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("speakflow_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, profile: true, level: true }
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ email: user.email, profile: user.profile, level: user.level });
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("speakflow_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET);
      payload = jwtPayload;
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!payload.userId) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const { profile } = await request.json();

    if (!profile) {
      return NextResponse.json({ error: "Profile data is required" }, { status: 400 });
    }

    // Default mapping logic based on user answers
    let calculatedLevel = "beginner";
    const difficultyMap: Record<string, string> = {
      "vocabulary": "beginner",
      "pronunciation": "intermediate",
      "grammar": "intermediate",
      "fluency": "advanced",
      "confidence": "advanced"
    };

    if (profile.learning_preferences?.biggest_difficulty) {
      calculatedLevel = difficultyMap[profile.learning_preferences.biggest_difficulty] || "beginner";
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId as string },
      data: {
        profile: profile,
        level: calculatedLevel
      },
      select: {
        id: true,
        email: true,
        name: true,
        level: true,
        profile: true
      }
    });

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Profile Endpoint Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
