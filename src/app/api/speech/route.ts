import { NextResponse } from 'next/server';

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const VOICE_ID = 'nCqaTnIbLdME87OuQaZY'; // Vira voice ID

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    console.log('Generating speech for text:', text);
    console.log('Using API key:', ELEVEN_LABS_API_KEY ? 'Present' : 'Missing');
    console.log('Voice ID:', VOICE_ID);

    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ElevenLabs API key is missing');
    }

    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;
    console.log('Making request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error response:', errorData);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Failed to generate speech: ${response.status} ${response.statusText}`);
    }

    console.log('Speech generated successfully');
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const audioBlob = await response.blob();
    const usage = response.headers.get('x-character-count');
    
    console.log('Audio blob size:', audioBlob.size);
    console.log('Character count:', usage);

    return new NextResponse(audioBlob, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBlob.size.toString(),
        'x-character-count': usage || '0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Помилка при генерації мовлення: ${errorMessage}` },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
} 