/**
 * CI-Medic Agent - LogAnalyzer Module (Edge Compatible)
 * 
 * Parses GitHub Actions failure logs and categorizes root causes
 */

export interface LogAnalysis {
  rootCause: 'typescript' | 'npm' | 'deployment' | 'test' | 'unknown';
  severity: 'critical' | 'high' | 'medium' | 'low';
  errors: Array<{
    file: string;
    line: number;
    code: string;
    message: string;
  }>;
  summary: string;
}

export class LogAnalyzer {
  /**
   * Analyzes raw GitHub Actions log text
   */
  analyze(logText: string): LogAnalysis {
    const errors = this.extractErrors(logText);
    const rootCause = this.categorizeRootCause(errors, logText);
    const severity = this.determineSeverity(errors, rootCause);
    const summary = this.generateSummary(rootCause, errors);

    return {
      rootCause,
      severity,
      errors,
      summary
    };
  }

  /**
   * Extracts TypeScript/npm errors from log text
   */
  private extractErrors(logText: string): Array<{ file: string; line: number; code: string; message: string }> {
    const errors: Array<{ file: string; line: number; code: string; message: string }> = [];
    
    // TypeScript error pattern: error TS####: message
    const tsErrorPattern = /##\[error\](.+)\((\d+),(\d+)\): error (TS\d+): (.+)/g;
    let match;
    
    while ((match = tsErrorPattern.exec(logText)) !== null) {
      const [, filePath, line, col, code, message] = match;
      errors.push({
        file: filePath,
        line: parseInt(line),
        code,
        message
      });
    }

    // npm error pattern
    const npmErrorPattern = /npm ERR!\s+(.+)/g;
    while ((match = npmErrorPattern.exec(logText)) !== null) {
      errors.push({
        file: 'package.json',
        line: 0,
        code: 'NPM_ERROR',
        message: match[1]
      });
    }

    return errors;
  }

  /**
   * Categorizes the root cause based on error patterns
   */
  private categorizeRootCause(errors: Array<{ file: string; line: number; code: string; message: string }>, logText: string): LogAnalysis['rootCause'] {
    if (errors.length === 0) return 'unknown';

    // Check for TypeScript errors
    const hasTSErrors = errors.some(e => e.code.startsWith('TS'));
    if (hasTSErrors) return 'typescript';

    // Check for npm errors
    const hasNpmErrors = errors.some(e => e.code === 'NPM_ERROR');
    if (hasNpmErrors) return 'npm';

    // Check for deployment errors
    if (logText.includes('wrangler deploy') || logText.includes('Cloudflare API')) {
      return 'deployment';
    }

    // Check for test failures
    if (logText.includes('vitest') || logText.includes('test failed')) {
      return 'test';
    }

    return 'unknown';
  }

  /**
   * Determines severity based on error count and type
   */
  private determineSeverity(errors: Array<{ file: string; line: number; code: string; message: string }>, rootCause: LogAnalysis['rootCause']): LogAnalysis['severity'] {
    if (errors.length > 20) return 'critical';
    if (errors.length > 10) return 'high';
    if (errors.length > 5) return 'medium';
    return 'low';
  }

  /**
   * Generates a human-readable summary
   */
  private generateSummary(rootCause: LogAnalysis['rootCause'], errors: Array<{ file: string; line: number; code: string; message: string }>): string {
    const count = errors.length;
    const causeMap = {
      typescript: 'TypeScript compilation errors',
      npm: 'npm dependency errors',
      deployment: 'Cloudflare deployment errors',
      test: 'Test suite failures',
      unknown: 'Unknown errors'
    };

    return `${count} ${causeMap[rootCause]} detected`;
  }
}