import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Schema } from '@/lib/types/schema'
import { exportToBDL } from '@/lib/exporters'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY in environment')
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server. Please add it to .env.local' },
        { status: 500 }
      )
    }

    const { schema } = (await req.json()) as { schema: Schema }
    
    if (!schema || !schema.tables || schema.tables.length === 0) {
      return NextResponse.json({ error: 'No schema provided' }, { status: 400 })
    }

    const bdlSchema = exportToBDL(schema)
    const genAI = new GoogleGenerativeAI(apiKey)

    const prompt = `SYSTEM:
You are a database relationship auditor. Analyse the schema and find all columns
that are likely undeclared foreign keys. Do not invent relationships — only suggest
ones supported by the column name, data type, and the presence of a matching target table.

Return ONLY a JSON array. Each element:
{
  "from_table": "string",
  "from_column": "string",
  "to_table": "string",
  "to_column": "string",
  "cardinality": "1-1" or "1-n" or "n-n",
  "confidence": "high" or "medium" or "low",
  "reason": "string"
}

Confidence rules:
- high: column name exactly matches {to_table}_id or {to_table}Id AND to_table exists
- medium: column name partially matches OR semantic match (e.g. "author_id" -> User table)
- low: type-only guess (int/uuid column with no name match)

Do not include already-declared foreign keys. Do not output markdown code blocks framing the JSON, just the raw JSON array.

USER EXPERT SCHEMA:
${bdlSchema}`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    try {
      // Parse the JSON array
      const suggestions = JSON.parse(responseText)
      // Add unique IDs
      const mapped = suggestions.map((s: any) => ({
        ...s,
        id: Math.random().toString(36).substring(7)
      }))
      return NextResponse.json({ suggestions: mapped })
    } catch (e) {
      console.error('Failed to parse AI response:', responseText)
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 })
    }
  } catch (error) {
    console.error('AI Link Suggester Error:', error)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
