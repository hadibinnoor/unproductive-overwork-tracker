import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get API URL from environment variable or use default
    const apiUrl = process.env.RISK_API_URL || process.env.NEXT_PUBLIC_RISK_API_URL || "http://127.0.0.1:5000/predict_risk";

    console.log("Proxying request to:", apiUrl);
    console.log("Payload:", body);

    // Forward the request to the risk API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to risk API", details: error.message },
      { status: 500 }
    );
  }
}

