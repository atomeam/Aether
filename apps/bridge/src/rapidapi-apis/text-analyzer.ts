/**
 * Text Analysis API for RapidAPI
 * Single-purpose: Analyze text for word count, character count, readability
 * Free tier: 100 requests/day
 * Pro tier: $5/month, 1,000 requests
 */

export interface TextAnalysisRequest {
  text: string;
}

export interface TextAnalysisResponse {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordLength: number;
  readingTime: number; // in seconds
}

export async function handleTextAnalysis(request: Request): Promise<Response> {
  try {
    const { text } = await request.json() as TextAnalysisRequest;
    
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), { status: 400 });
    }
    
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const characterCount = text.length;
    const characterCountNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const sentenceCount = sentences.length;
    const paragraphs = text.split(/\n\n+/).filter(para => para.trim().length > 0);
    const paragraphCount = paragraphs.length;
    const averageWordLength = wordCount > 0 ? characterCountNoSpaces / wordCount : 0;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/minute
    
    const response: TextAnalysisResponse = {
      wordCount,
      characterCount,
      characterCountNoSpaces,
      sentenceCount,
      paragraphCount,
      averageWordLength: Math.round(averageWordLength * 100) / 100,
      readingTime,
    };
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
}
