import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Make the same request to the session API
    const response = await fetch('http://localhost:3000/api/session');
    
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { parseError: true, rawText: responseText };
    }
    
    return NextResponse.json({
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: data,
      hasClientSecret: !!data?.client_secret,
      hasValue: !!data?.client_secret?.value
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}