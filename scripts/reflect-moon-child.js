#!/usr/bin/env node

/**
 * Store Moon Child review in agent reflection system via direct API
 */

const API_URL = 'http://localhost:3002/api/agents/reflect';

async function reflect() {
  const requestData = {
    lesson: "Moon Child Pocket PC game review absorbed and documented. Platform: Pocket PC, Developer: Clickgamer, Publisher: Klaar, Price: $14.95, Score: 8.5/10. Key features: 13 levels across 4 worlds, dual control schemes (D-Pad + stylus/tap), real-time interpolated graphics, optical illusion level design. Notable quote: Mario has nothing on Moon Child! Game represents peak of Pocket PC gaming with innovative controls and performance optimization. Tested on Samsung 1700, HP Jornada 568, iPAQ 3955. Family-friendly platformer with no weapons, pure platforming gameplay. Documented in MOON_CHILD_REVIEW.md for permanent reference."
  };
  
  try {
    console.log('Storing Moon Child review in agent reflection system...\n');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Moon Child review stored in agent reflection system');
    } else {
      console.log('\n❌ FAILED! Could not store review');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

reflect();
