/**
 * Email Validation API for RapidAPI
 * Single-purpose: Validate email addresses
 * Free tier: 100 requests/day
 * Pro tier: $5/month, 1,000 requests
 */

export interface EmailValidationRequest {
  email: string;
}

export interface EmailValidationResponse {
  valid: boolean;
  email: string;
  reason?: string;
  suggestions?: string[];
}

export async function handleEmailValidation(request: Request): Promise<Response> {
  try {
    const { email } = await request.json() as EmailValidationRequest;
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    const response: EmailValidationResponse = {
      valid: isValid,
      email,
      reason: isValid ? undefined : 'Invalid email format',
      suggestions: isValid ? undefined : ['Check for typos', 'Ensure @ symbol is present', 'Verify domain is correct']
    };
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
}
