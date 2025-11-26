import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: 'API key is required' } },
        { status: 401 }
      );
    }

    // LandingAI extract endpoint expects FormData with markdown as a file
    const formData = new FormData();

    // Create a blob from the markdown string and append as a file
    const markdownBlob = new Blob([body.markdown], { type: 'text/markdown' });
    formData.append('markdown', markdownBlob, 'document.md');

    // Append model if provided
    if (body.model) {
      formData.append('model', body.model);
    }

    // Append schema as JSON string
    if (body.schema) {
      formData.append('schema', JSON.stringify(body.schema));
    }

    const response = await fetch('https://api.va.landing.ai/v1/ade/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
