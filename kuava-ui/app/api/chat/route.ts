import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    
    // CHANGE 1: Ensure the fallback email exactly matches your TEAM_WHITELIST in main.py
    const tailscaleUser = headersList.get("Tailscale-User-Login") || "local_developer@uni.edu";

    const formData = await req.formData();

    // CHANGE 2: Use 127.0.0.1 instead of localhost for more stability
    const response = await fetch("http://127.0.0.1:8000/ask", {
      method: "POST",
      headers: {
        "Tailscale-User-Login": tailscaleUser,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.detail }, { status: response.status });
    }

    // 4. Return the stream back to the browser
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to connect to backend" }, { status: 500 });
  }
}