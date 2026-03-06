import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { postUrl, payload } = await req.json();

    if (!postUrl || typeof postUrl !== "string") {
      return NextResponse.json({ error: "Missing postUrl" }, { status: 400 });
    }
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    // Proxy server-side para evitar CORS
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // keepalive no aplica en server, pero ok
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: "Sheets error", details: text }, { status: 502 });
    }
    return NextResponse.json({ ok: true, details: text });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal error", details: String(e?.message || e) }, { status: 500 });
  }
}
