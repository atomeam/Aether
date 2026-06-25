// a-to-mind API Endpoints
// Comprehensive automation and productivity API

export async function handleAToMindRequest(request: Request, path: string): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  // GET /api/a-to-mind/health - Health check
  if (path === '/api/a-to-mind/health' && method === 'GET') {
    return new Response(JSON.stringify({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/a-to-mind/analyze - Analyze text/data
  if (path === '/api/a-to-mind/analyze' && method === 'POST') {
    try {
      const body = await request.json();
      const { text, type = 'general' } = body;

      if (!text) {
        return new Response(JSON.stringify({ error: 'Text is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const wordCount = text.split(/\s+/).length;
      const characterCount = text.length;
      const characterCountNoSpaces = text.replace(/\s/g, '').length;
      const sentenceCount = text.split(/[.!?]+/).length - 1;
      const paragraphCount = text.split(/\n\n+/).length;
      const averageWordLength = characterCountNoSpaces / wordCount;
      const readingTime = Math.ceil(wordCount / 200);

      let analysis = {
        wordCount,
        characterCount,
        characterCountNoSpaces,
        sentenceCount,
        paragraphCount,
        averageWordLength: parseFloat(averageWordLength.toFixed(2)),
        readingTime,
      };

      // Add type-specific analysis
      if (type === 'sentiment') {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'joy', 'success'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'failure', 'worse', 'worst'];
        
        const words = text.toLowerCase().split(/\s+/);
        const positiveCount = words.filter(w => positiveWords.includes(w)).length;
        const negativeCount = words.filter(w => negativeWords.includes(w)).length;
        
        let sentiment = 'neutral';
        if (positiveCount > negativeCount) sentiment = 'positive';
        if (negativeCount > positiveCount) sentiment = 'negative';
        
        analysis = {
          ...analysis,
          sentiment,
          positiveCount,
          negativeCount,
          confidence: Math.abs(positiveCount - negativeCount) / words.length,
        };
      }

      if (type === 'keywords') {
        const words = text.toLowerCase().split(/\s+/);
        const wordFreq = {};
        words.forEach(word => {
          if (word.length > 3) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
          }
        });
        
        const keywords = Object.entries(wordFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word, count]) => ({ word, count }));
        
        analysis = {
          ...analysis,
          keywords,
        };
      }

      return new Response(JSON.stringify({
        success: true,
        type,
        analysis,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/a-to-mind/generate - Generate content
  if (path === '/api/a-to-mind/generate' && method === 'POST') {
    try {
      const body = await request.json();
      const { prompt, type = 'summary', length = 'medium' } = body;

      if (!prompt) {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let result = '';

      if (type === 'summary') {
        const words = prompt.split(/\s+/);
        const summaryLength = length === 'short' ? Math.floor(words.length * 0.2) : Math.floor(words.length * 0.5);
        result = words.slice(0, summaryLength).join(' ') + '...';
      }

      if (type === 'title') {
        const words = prompt.split(/\s+/).slice(0, 5);
        result = words.join(' ').charAt(0).toUpperCase() + words.join(' ').slice(1);
      }

      if (type === 'hashtags') {
        const words = prompt.toLowerCase().split(/\s+/);
        const hashtags = words
          .filter(w => w.length > 3)
          .map(w => `#${w.replace(/[^a-z0-9]/g, '')}`)
          .slice(0, 5);
        result = hashtags.join(' ');
      }

      return new Response(JSON.stringify({
        success: true,
        type,
        result,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/a-to-mind/transform - Transform data
  if (path === '/api/a-to-mind/transform' && method === 'POST') {
    try {
      const body = await request.json();
      const { data, operation } = body;

      if (!data || !operation) {
        return new Response(JSON.stringify({ error: 'Data and operation are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let result;

      if (operation === 'uppercase') {
        result = data.toUpperCase();
      }

      if (operation === 'lowercase') {
        result = data.toLowerCase();
      }

      if (operation === 'reverse') {
        result = data.split('').reverse().join('');
      }

      if (operation === 'base64_encode') {
        result = btoa(data);
      }

      if (operation === 'base64_decode') {
        result = atob(data);
      }

      if (operation === 'json_prettify') {
        try {
          const parsed = JSON.parse(data);
          result = JSON.stringify(parsed, null, 2);
        } catch {
          result = 'Invalid JSON';
        }
      }

      if (operation === 'json_minify') {
        try {
          const parsed = JSON.parse(data);
          result = JSON.stringify(parsed);
        } catch {
          result = 'Invalid JSON';
        }
      }

      return new Response(JSON.stringify({
        success: true,
        operation,
        result,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/a-to-mind/validate - Validate data
  if (path === '/api/a-to-mind/validate' && method === 'POST') {
    try {
      const body = await request.json();
      const { data, type } = body;

      if (!data || !type) {
        return new Response(JSON.stringify({ error: 'Data and type are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let result = { valid: false, errors: [] };

      if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        result.valid = emailRegex.test(data);
        if (!result.valid) {
          result.errors.push('Invalid email format');
        }
      }

      if (type === 'url') {
        try {
          new URL(data);
          result.valid = true;
        } catch {
          result.errors.push('Invalid URL format');
        }
      }

      if (type === 'phone') {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        result.valid = phoneRegex.test(data) && data.replace(/\D/g, '').length >= 10;
        if (!result.valid) {
          result.errors.push('Invalid phone number format');
        }
      }

      if (type === 'json') {
        try {
          JSON.parse(data);
          result.valid = true;
        } catch {
          result.errors.push('Invalid JSON format');
        }
      }

      return new Response(JSON.stringify({
        success: true,
        type,
        validation: result,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/a-to-mind/extract - Extract data
  if (path === '/api/a-to-mind/extract' && method === 'POST') {
    try {
      const body = await request.json();
      const { text, type } = body;

      if (!text || !type) {
        return new Response(JSON.stringify({ error: 'Text and type are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let result = [];

      if (type === 'emails') {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        result = text.match(emailRegex) || [];
      }

      if (type === 'urls') {
        const urlRegex = /https?:\/\/[^\s]+/g;
        result = text.match(urlRegex) || [];
      }

      if (type === 'phone_numbers') {
        const phoneRegex = /\+?[\d\s-()]{10,}/g;
        result = text.match(phoneRegex) || [];
      }

      if (type === 'hashtags') {
        const hashtagRegex = /#[\w]+/g;
        result = text.match(hashtagRegex) || [];
      }

      if (type === 'mentions') {
        const mentionRegex = /@[\w]+/g;
        result = text.match(mentionRegex) || [];
      }

      return new Response(JSON.stringify({
        success: true,
        type,
        extracted: result,
        count: result.length,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/a-to-mind/compare - Compare data
  if (path === '/api/a-to-mind/compare' && method === 'POST') {
    try {
      const body = await request.json();
      const { data1, data2, type = 'text' } = body;

      if (!data1 || !data2) {
        return new Response(JSON.stringify({ error: 'data1 and data2 are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let result;

      if (type === 'text') {
        const similarity = calculateSimilarity(data1, data2);
        result = {
          similarity: similarity.percentage,
          commonWords: similarity.commonWords,
          difference: similarity.difference,
        };
      }

      if (type === 'json') {
        try {
          const json1 = JSON.parse(data1);
          const json2 = JSON.parse(data2);
          result = {
            equal: JSON.stringify(json1) === JSON.stringify(json2),
            keys1: Object.keys(json1),
            keys2: Object.keys(json2),
            addedKeys: Object.keys(json2).filter(k => !json1.hasOwnProperty(k)),
            removedKeys: Object.keys(json1).filter(k => !json2.hasOwnProperty(k)),
          };
        } catch {
          result = { error: 'Invalid JSON' };
        }
      }

      return new Response(JSON.stringify({
        success: true,
        type,
        comparison: result,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

function calculateSimilarity(text1: string, text2: string) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  const percentage = (intersection.size / union.size) * 100;
  
  const commonWords = Array.from(intersection);
  const difference = {
    inText1: Array.from(set1).filter(x => !set2.has(x)),
    inText2: Array.from(set2).filter(x => !set1.has(x)),
  };
  
  return {
    percentage: parseFloat(percentage.toFixed(2)),
    commonWords,
    difference,
  };
}
