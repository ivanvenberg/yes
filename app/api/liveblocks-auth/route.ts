import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY! });

export async function POST(request: NextRequest) {
  const { playerId, playerName, roomId } = await request.json();
  if (!playerId || !playerName) return NextResponse.json({ error: "Missing info" }, { status: 400 });
  const session = liveblocks.prepareSession(playerId, { userInfo: { name: playerName } });
  session.allow(roomId, session.FULL_ACCESS);
  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
