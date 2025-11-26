import { NextRequest, NextResponse } from 'next/server';
import { HARDCODED_FIELDS } from '@/lib/constants';

interface ExtractRequestBody {
  markdown: string;
  model?: string;
  schema?: {
    properties: Record<string, any>;
    required: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ExtractRequestBody;
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

    // Build schema with hardcoded fields + user-defined fields
    const hardcodedFieldProperties = HARDCODED_FIELDS.reduce((acc, field) => {
      acc[field.name] = {
        type: field.type,
        description: field.description
      };
      return acc;
    }, {} as Record<string, any>);

    const hardcodedFieldNames = HARDCODED_FIELDS.map(f => f.name);

    // Merge hardcoded fields with user-provided schema
    const schema = {
      type: 'object',
      properties: {
        ...hardcodedFieldProperties,
        ...(body.schema?.properties || {})
      },
      required: [
        ...hardcodedFieldNames,
        ...(body.schema?.required || [])
      ]
    };

    formData.append('schema', JSON.stringify(schema));

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
