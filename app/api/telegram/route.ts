import { NextRequest, NextResponse } from "next/server";
import { handleMessage } from "@/lib/bot/handler";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const message = body.message;
  const text: string = message?.text ?? "";
  const chatId: string = String(message?.chat?.id);

  if (text) {
    await handleMessage(text, chatId);
  }

  return NextResponse.json({ ok: true });
}
