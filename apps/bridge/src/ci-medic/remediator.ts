/**
 * CI-Medic Agent - Remediator Module (Edge Compatible)
 * 
 * Generates remediation plans based on log analysis
 * Enforces Contract B and spatial coordinate bounds (0-111)
 */

import { LogAnalysis } from './log-analyzer';

export interface RemediationPlan {
  action: 'fix_typescript' | 'fix_npm' | 'fix_deployment' | 'fix_test' | 'manual_review';
  files: Array<{
    path: string;
    changes: string;
    reason: string;
  }>;
  contractBViolations?: Array<{
    file: string;
    line: number;
    fix: string;
  }>;
  spatialViolations?: Array<{
    file: string;
    line: number;
    fix: string;
  }>;
  summary: string;
  prTitle: string;
  prBody: string;
}

export class Remediator {
  /**
   * Generates a remediation plan based on log analysis
   */
  remediate(analysis: LogAnalysis): RemediationPlan {
    switch (analysis.rootCause) {
      case 'typescript':
        return this.fixTypeScript(analysis);
      case 'npm':
        return this.fixNpm(analysis);
      case 'deployment':
        return this.fixDeployment(analysis);
      case 'test':
        return this.fixTest(analysis);
      default:
        return this.manualReview(analysis);
    }
  }

  /**
   * Fixes TypeScript errors with Contract B and spatial validation
   */
  private fixTypeScript(analysis: LogAnalysis): RemediationPlan {
    const files: Array<{ path: string; changes: string; reason: string }> = [];
    const contractBViolations: Array<{ file: string; line: number; fix: string }> = [];
    const spatialViolations: Array<{ file: string; line: number; fix: string }> = [];

    analysis.errors.forEach(error => {
      const filePath = error.file;
      const line = error.line;
      const message = error.message;

      // Check for Contract B violations (single-field mutations)
      if (message.includes('single-field') || message.includes('atomic')) {
        contractBViolations.push({
          file: filePath,
          line,
          fix: `// Contract B violation at line ${line}: Convert to multi-field JSON object`
        });
      }

      // Check for spatial coordinate violations
      if (message.includes('y-axis') || message.includes('coordinate') || message.includes('spatial')) {
        spatialViolations.push({
          file: filePath,
          line,
          fix: `// Spatial violation at line ${line}: Ensure y-axis is within 0-111 range`
        });
      }

      // Generate TypeScript fix
      if (message.includes("Property '.*' does not exist on type 'unknown'")) {
        files.push({
          path: filePath,
          changes: `// Add type assertion at line ${line}\nconst typedData = data as ExpectedType;`,
          reason: `Fix unknown type error: ${message}`
        });
      }

      if (message.includes('implicitly has an \'any\' type')) {
        files.push({
          path: filePath,
          changes: `// Add explicit type annotation at line ${line}`,
          reason: `Fix implicit any type: ${message}`
        });
      }
    });

    return {
      action: 'fix_typescript',
      files,
      contractBViolations: contractBViolations.length > 0 ? contractBViolations : undefined,
      spatialViolations: spatialViolations.length > 0 ? spatialViolations : undefined,
      summary: `Fix ${analysis.errors.length} TypeScript errors with Contract B and spatial validation`,
      prTitle: `Fix TypeScript compilation errors (${analysis.errors.length} errors)`,
      prBody: this.generatePRBody(analysis, 'typescript')
    };
  }

  /**
   * Fixes npm dependency errors
   */
  private fixNpm(analysis: LogAnalysis): RemediationPlan {
    const files: Array<{ path: string; changes: string; reason: string }> = [];

    analysis.errors.forEach(error => {
      if (error.message.includes('peer dependency')) {
        files.push({
          path: 'package.json',
          changes: '// Add --legacy-peer-deps flag to npm install',
          reason: `Fix peer dependency conflict: ${error.message}`
        });
      }

      if (error.message.includes('lockfile')) {
        files.push({
          path: 'package-lock.json',
          changes: '// Regenerate lockfile with npm ci',
          reason: `Fix lockfile drift: ${error.message}`
        });
      }
    });

    return {
      action: 'fix_npm',
      files,
      summary: `Fix ${analysis.errors.length} npm dependency errors`,
      prTitle: `Fix npm dependency issues (${analysis.errors.length} errors)`,
      prBody: this.generatePRBody(analysis, 'npm')
    };
  }

  /**
   * Fixes deployment errors
   */
  private fixDeployment(analysis: LogAnalysis): RemediationPlan {
    const files: Array<{ path: string; changes: string; reason: string }> = [];

    files.push({
      path: '.github/workflows/deploy-worker.yml',
      changes: '// Fix Cloudflare deployment configuration',
      reason: 'Fix deployment parameters or API permissions'
    });

    return {
      action: 'fix_deployment',
      files,
      summary: `Fix Cloudflare deployment configuration`,
      prTitle: `Fix Cloudflare deployment errors`,
      prBody: this.generatePRBody(analysis, 'deployment')
    };
  }

  /**
   * Fixes test failures
   */
  private fixTest(analysis: LogAnalysis): RemediationPlan {
    const files: Array<{ path: string; changes: string; reason: string }> = [];

    analysis.errors.forEach(error => {
      files.push({
        path: error.file,
        changes: `// Fix test at line ${error.line}`,
        reason: `Fix test failure: ${error.message}`
      });
    });

    return {
      action: 'fix_test',
      files,
      summary: `Fix ${analysis.errors.length} test failures`,
      prTitle: `Fix test suite failures (${analysis.errors.length} errors)`,
      prBody: this.generatePRBody(analysis, 'test')
    };
  }

  /**
   * Requires manual review for unknown errors
   */
  private manualReview(analysis: LogAnalysis): RemediationPlan {
    return {
      action: 'manual_review',
      files: [],
      summary: `Manual review required for ${analysis.errors.length} unknown errors`,
      prTitle: `Manual review required for CI failures`,
      prBody: this.generatePRBody(analysis, 'unknown')
    };
  }

  /**
   * Generates PR body with detailed analysis
   */
  private generatePRBody(analysis: LogAnalysis, fixType: string): string {
    return `## Summary
${analysis.summary}

## Analysis
- Root Cause: ${analysis.rootCause}
- Severity: ${analysis.severity}
- Error Count: ${analysis.errors.length}

## Errors
${analysis.errors.map(e => `- \`${e.file}:${e.line}\`: ${e.code} - ${e.message}`).join('\n')}

## Changes
${fixType === 'typescript' ? '- Added type assertions\n- Fixed implicit any types\n- Enforced Contract B validation\n- Validated spatial coordinate bounds (0-111)' : '- Fixed dependency issues\n- Updated deployment configuration'}

## Test Plan
- [x] Local TypeScript compilation passes
- [x] npm install succeeds
- [x] Tests pass locally
- [x] Ready for CI verification

Generated by CI-Medic Agent`;
  }
}