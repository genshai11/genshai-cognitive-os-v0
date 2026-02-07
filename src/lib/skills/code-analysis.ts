/**
 * Static code analysis for AI-generated skills
 * Detects dangerous patterns and calculates complexity
 * @module lib/skills/code-analysis
 */

import type { CodeAnalysis, CodeAnalysisResult } from '@/types/skills';

interface Pattern {
    pattern: RegExp;
    message: string;
    severity: 'critical' | 'warning';
}

// Patterns that BLOCK code execution (critical security risks)
const CRITICAL_PATTERNS: Pattern[] = [
    {
        pattern: /eval\s*\(/gi,
        message: 'Uses eval() - code injection risk',
        severity: 'critical'
    },
    {
        pattern: /Function\s*\(/gi,
        message: 'Creates dynamic functions via Function constructor',
        severity: 'critical'
    },
    {
        pattern: /new\s+Function/gi,
        message: 'Creates dynamic functions via new Function',
        severity: 'critical'
    },
    {
        pattern: /Deno\./gi,
        message: 'Accesses Deno runtime APIs',
        severity: 'critical'
    },
    {
        pattern: /process\./gi,
        message: 'Accesses Node.js process APIs',
        severity: 'critical'
    },
    {
        pattern: /require\s*\(/gi,
        message: 'Uses require() - module loading',
        severity: 'critical'
    },
    {
        pattern: /import\s+.*\s+from/gi,
        message: 'Uses ES6 import statements',
        severity: 'critical'
    },
    {
        pattern: /__proto__/gi,
        message: 'Accesses __proto__ - prototype pollution risk',
        severity: 'critical'
    },
    {
        pattern: /constructor\s*\[/gi,
        message: 'Accesses constructor property',
        severity: 'critical'
    },
    {
        pattern: /globalThis/gi,
        message: 'Accesses globalThis object',
        severity: 'critical'
    },
    {
        pattern: /window\./gi,
        message: 'Accesses window object',
        severity: 'critical'
    },
    {
        pattern: /document\./gi,
        message: 'Accesses document object',
        severity: 'critical'
    },
    {
        pattern: /fetch\s*\(/gi,
        message: 'Makes network requests via fetch',
        severity: 'critical'
    },
    {
        pattern: /XMLHttpRequest/gi,
        message: 'Makes network requests via XMLHttpRequest',
        severity: 'critical'
    },
    {
        pattern: /WebSocket/gi,
        message: 'Creates WebSocket connections',
        severity: 'critical'
    },
    {
        pattern: /localStorage/gi,
        message: 'Accesses localStorage',
        severity: 'critical'
    },
    {
        pattern: /sessionStorage/gi,
        message: 'Accesses sessionStorage',
        severity: 'critical'
    },
    {
        pattern: /indexedDB/gi,
        message: 'Accesses IndexedDB',
        severity: 'critical'
    }
];

// Patterns that WARN but don't block (potential issues)
const WARNING_PATTERNS: Pattern[] = [
    {
        pattern: /while\s*\(/gi,
        message: 'Contains while loop - ensure termination condition',
        severity: 'warning'
    },
    {
        pattern: /for\s*\(/gi,
        message: 'Contains for loop - verify loop bounds',
        severity: 'warning'
    },
    {
        pattern: /recursion|recursive/gi,
        message: 'Mentions recursion - stack overflow risk',
        severity: 'warning'
    },
    {
        pattern: /Math\.random/gi,
        message: 'Uses Math.random() - non-deterministic results',
        severity: 'warning'
    },
    {
        pattern: /Date\.now/gi,
        message: 'Uses Date.now() - time-dependent results',
        severity: 'warning'
    },
    {
        pattern: /new\s+Date/gi,
        message: 'Creates Date objects - time-dependent results',
        severity: 'warning'
    },
    {
        pattern: /setTimeout|setInterval/gi,
        message: 'Uses timers - async behavior',
        severity: 'warning'
    },
    {
        pattern: /Promise/gi,
        message: 'Uses Promises - async behavior',
        severity: 'warning'
    },
    {
        pattern: /async\s+function/gi,
        message: 'Uses async functions - async behavior',
        severity: 'warning'
    }
];

/**
 * Analyze code for security risks and complexity
 */
export function analyzeCode(code: string): CodeAnalysis {
    const risks: string[] = [];
    const warnings: string[] = [];
    const blockedPatterns: string[] = [];

    // Check critical patterns (security risks)
    for (const { pattern, message } of CRITICAL_PATTERNS) {
        if (pattern.test(code)) {
            risks.push(message);
            blockedPatterns.push(pattern.source);
        }
    }

    // Check warning patterns (potential issues)
    for (const { pattern, message } of WARNING_PATTERNS) {
        if (pattern.test(code)) {
            warnings.push(message);
        }
    }

    // Calculate code complexity
    const complexity = calculateComplexity(code);

    return {
        safe: risks.length === 0,
        risks,
        warnings,
        complexity,
        blockedPatterns
    };
}

/**
 * Analyze code and provide recommendation
 */
export function analyzeCodeWithRecommendation(code: string): CodeAnalysisResult {
    const analysis = analyzeCode(code);

    let recommendation: 'approve' | 'review' | 'reject';
    let message: string;

    if (!analysis.safe) {
        recommendation = 'reject';
        message = `Code contains ${analysis.risks.length} critical security risk(s). Cannot approve.`;
    } else if (analysis.warnings.length > 0) {
        recommendation = 'review';
        message = `Code has ${analysis.warnings.length} warning(s). Please review carefully before approving.`;
    } else if (analysis.complexity > 20) {
        recommendation = 'review';
        message = `Code complexity is high (${analysis.complexity}). Please review for maintainability.`;
    } else {
        recommendation = 'approve';
        message = 'Code appears safe. No critical issues detected.';
    }

    return {
        ...analysis,
        recommendation,
        message
    };
}

/**
 * Calculate code complexity score
 * Higher score = more complex code
 */
function calculateComplexity(code: string): number {
    let score = 0;

    // Control structures (weighted by complexity)
    score += (code.match(/if\s*\(/g) || []).length * 1;
    score += (code.match(/else\s+if/g) || []).length * 1;
    score += (code.match(/else/g) || []).length * 1;
    score += (code.match(/switch\s*\(/g) || []).length * 2;
    score += (code.match(/case\s+/g) || []).length * 1;
    score += (code.match(/for\s*\(/g) || []).length * 2;
    score += (code.match(/while\s*\(/g) || []).length * 3;
    score += (code.match(/do\s*{/g) || []).length * 3;
    score += (code.match(/\?\s*.*\s*:/g) || []).length * 1; // Ternary operators

    // Functions and methods
    score += (code.match(/function\s+\w+/g) || []).length * 2;
    score += (code.match(/=>\s*{/g) || []).length * 1; // Arrow functions
    score += (code.match(/\.\w+\(/g) || []).length * 0.5; // Method calls

    // Try-catch blocks
    score += (code.match(/try\s*{/g) || []).length * 2;
    score += (code.match(/catch\s*\(/g) || []).length * 2;

    // Logical operators
    score += (code.match(/&&/g) || []).length * 0.5;
    score += (code.match(/\|\|/g) || []).length * 0.5;

    // Lines of code (non-empty, non-comment)
    const lines = code
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
        });
    score += Math.floor(lines.length / 10);

    // Nesting depth (rough estimate)
    const maxNesting = calculateMaxNesting(code);
    score += maxNesting * 2;

    return Math.round(score);
}

/**
 * Calculate maximum nesting depth
 */
function calculateMaxNesting(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
        if (char === '{') {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
        } else if (char === '}') {
            currentDepth--;
        }
    }

    return maxDepth;
}

/**
 * Extract function name from code
 */
export function extractFunctionName(code: string): string | null {
    // Try to find function declaration
    const functionMatch = code.match(/function\s+(\w+)\s*\(/);
    if (functionMatch) {
        return functionMatch[1];
    }

    // Try to find arrow function assignment
    const arrowMatch = code.match(/const\s+(\w+)\s*=\s*\(/);
    if (arrowMatch) {
        return arrowMatch[1];
    }

    return null;
}

/**
 * Validate that code defines exactly one function
 */
export function validateSingleFunction(code: string): { valid: boolean; error?: string } {
    const functionCount = (code.match(/function\s+\w+/g) || []).length;
    const arrowFunctionCount = (code.match(/const\s+\w+\s*=\s*\(/g) || []).length;
    const totalFunctions = functionCount + arrowFunctionCount;

    if (totalFunctions === 0) {
        return { valid: false, error: 'No function definition found' };
    }

    if (totalFunctions > 1) {
        return { valid: false, error: 'Multiple function definitions found. Only one function allowed.' };
    }

    return { valid: true };
}

/**
 * Get security level based on analysis
 */
export function getSecurityLevel(analysis: CodeAnalysis): 'safe' | 'caution' | 'danger' {
    if (!analysis.safe) {
        return 'danger';
    }

    if (analysis.warnings.length > 3 || analysis.complexity > 30) {
        return 'caution';
    }

    return 'safe';
}
