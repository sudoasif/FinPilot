import { NextResponse } from "next/server";
import { z } from "zod";
import { askCopilot } from "@/lib/copilot";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Send a question between 1 and 2,000 characters." },
      { status: 400 },
    );
  }

  const db = await readDb();
  if (!db.settings.enableCopilot) {
    return NextResponse.json(
      { error: "The copilot is disabled for this workspace." },
      { status: 403 },
    );
  }

  const answer = await askCopilot(parsed.data.messages, db);

  return NextResponse.json(answer);
}
