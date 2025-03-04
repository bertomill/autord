import { NextRequest, NextResponse } from 'next/server';

// Base URL for Supadata API
const SUPADATA_BASE_URL = 'https://api.supadata.ai/v1';
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { endpoint, params } = await request.json();
    
    if (!SUPADATA_API_KEY) {
      return NextResponse.json(
        { error: 'Supadata API key not configured' },
        { status: 500 }
      );
    }

    // Construct the URL with query parameters
    const url = new URL(`${SUPADATA_BASE_URL}/${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value as string);
        }
      });
    }

    // Make the request to Supadata API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': SUPADATA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch from Supadata API' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Supadata API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 