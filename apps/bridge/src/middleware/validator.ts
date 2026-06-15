/**
 * MutationValidator Middleware
 * 
 * Strict validation layer for aether-bridge Worker that intercepts
 * Natural Language Intents (NLI-001) and autonomous infrastructure
 * remediation plans before execution.
 */

// Custom error classes
export class MalformedContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedContractError';
  }
}

export class CoordinateOutOfBoundsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoordinateOutOfBoundsError';
  }
}

// Contract B validation types
interface ValidatedPayload {
  [key: string]: unknown;
}

interface SpatialCoordinates {
  x?: number;
  y?: number;
  z?: number;
  [key: string]: unknown;
}

/**
 * Validates that a payload follows Contract B (atomic, multi-field JSON objects)
 * Rejects single-field mutation patterns and fragmented schemas
 */
function validateContractB(payload: unknown): ValidatedPayload {
  if (typeof payload !== 'object' || payload === null) {
    throw new MalformedContractError('Payload must be a non-null object');
  }

  const obj = payload as Record<string, unknown>;
  const keys = Object.keys(obj);

  // Contract B: Must have multiple fields (atomic, multi-field)
  if (keys.length < 2) {
    throw new MalformedContractError(
      `Contract B violation: Payload must be atomic multi-field JSON object. Found ${keys.length} field(s): ${keys.join(', ')}`
    );
  }

  // Reject legacy single-field patterns
  if (keys.length === 1) {
    throw new MalformedContractError(
      `Legacy single-field schema rejected: Contract B requires atomic multi-field objects. Field: ${keys[0]}`
    );
  }

  // Ensure all values are valid JSON-serializable types
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      throw new MalformedContractError(`Field "${key}" has undefined value`);
    }
  }

  return obj as ValidatedPayload;
}

/**
 * Validates spatial coordinate bounds
 * Enforces y-axis range of 0-111
 */
function validateSpatialCoordinates(payload: ValidatedPayload): ValidatedPayload {
  const spatialPayload = payload as SpatialCoordinates;

  // Check if payload contains spatial coordinates
  if (spatialPayload.x !== undefined || 
      spatialPayload.y !== undefined || 
      spatialPayload.z !== undefined) {
    
    // Validate y-axis bounds (0-111)
    if (spatialPayload.y !== undefined) {
      if (typeof spatialPayload.y !== 'number') {
        throw new MalformedContractError('Y-coordinate must be a number');
      }
      
      if (spatialPayload.y < 0 || spatialPayload.y > 111) {
        throw new CoordinateOutOfBoundsError(
          `Y-coordinate out of bounds: ${spatialPayload.y}. Valid range is 0-111`
        );
      }
    }

    // Validate x and z if present (assuming reasonable bounds)
    if (spatialPayload.x !== undefined && typeof spatialPayload.x !== 'number') {
      throw new MalformedContractError('X-coordinate must be a number');
    }
    
    if (spatialPayload.z !== undefined && typeof spatialPayload.z !== 'number') {
      throw new MalformedContractError('Z-coordinate must be a number');
    }
  }

  return payload;
}

/**
 * Logs validation failures to reliability-tracing D1 database
 */
async function logValidationFailure(
  env: Env,
  payload: unknown,
  error: Error
): Promise<void> {
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error_type: error.name,
      error_message: error.message,
      failed_payload: JSON.stringify(payload),
      source: 'mutation-validator'
    };

    await env.RELIABILITY_TRACING.prepare(
      'INSERT INTO validation_failures (timestamp, error_type, error_message, failed_payload, source) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      errorLog.timestamp,
      errorLog.error_type,
      errorLog.error_message,
      errorLog.failed_payload,
      errorLog.source
    ).run();
  } catch (logError) {
    // Fail silently on logging errors to avoid breaking the main flow
    console.error('Failed to log validation error:', logError);
  }
}

/**
 * Main validation function
 * Validates payload against Contract B and spatial bounds
 * Logs failures and returns validated payload for execution
 */
export async function validateMutation(
  payload: unknown,
  env: Env
): Promise<ValidatedPayload> {
  try {
    // Step 1: Validate Contract B
    const contractValidated = validateContractB(payload);
    
    // Step 2: Validate spatial coordinates
    const spatialValidated = validateSpatialCoordinates(contractValidated);
    
    // Step 3: Return validated payload for council-routing-db insertion
    return spatialValidated;
    
  } catch (error) {
    // Log validation failure to reliability-tracing
    await logValidationFailure(env, payload, error as Error);
    
    // Re-throw to let the caller handle the error
    throw error;
  }
}

/**
 * Batch validation for multiple payloads
 * Returns array of validated payloads and array of errors
 */
export async function validateMutations(
  payloads: unknown[],
  env: Env
): Promise<{ validated: ValidatedPayload[]; errors: Error[] }> {
  const validated: ValidatedPayload[] = [];
  const errors: Error[] = [];

  for (const payload of payloads) {
    try {
      const result = await validateMutation(payload, env);
      validated.push(result);
    } catch (error) {
      errors.push(error as Error);
    }
  }

  return { validated, errors };
}