import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

let openai: OpenAI | null = null

function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openai
}

const PRIMARY_TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe'
const FALLBACK_TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_FALLBACK_MODEL || 'whisper-1'

function isModelAccessError(error: unknown) {
  if (!(error instanceof OpenAI.APIError)) return false

  return error.status === 403 && error.code === 'model_not_found'
}

async function transcribeWithModel(audio: File, model: string) {
  return getOpenAIClient().audio.transcriptions.create({
    file: audio,
    model,
    prompt: 'Transcribe a Jollibee kiosk food order. The speaker may use English, Tagalog, or Taglish.',
    response_format: 'json',
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio')

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file must be smaller than 25 MB' },
        { status: 413 }
      )
    }

    let transcription

    try {
      transcription = await transcribeWithModel(audio, PRIMARY_TRANSCRIPTION_MODEL)
    } catch (error) {
      if (!isModelAccessError(error)) {
        throw error
      }

      console.warn(`Falling back to ${FALLBACK_TRANSCRIPTION_MODEL} for transcription because this OpenAI project cannot access ${PRIMARY_TRANSCRIPTION_MODEL}.`)
      try {
        transcription = await transcribeWithModel(audio, FALLBACK_TRANSCRIPTION_MODEL)
      } catch (fallbackError) {
        if (!isModelAccessError(fallbackError)) {
          throw fallbackError
        }

        return NextResponse.json(
          { error: 'This OpenAI project does not have access to audio transcription models yet. Check API billing, usage tier, and project/org access.' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('OpenAI transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}
