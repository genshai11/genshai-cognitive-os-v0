/**
 * JSON Schema validation utilities using Ajv
 * @module lib/skills/validation
 */

import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import type { JSONSchema, ValidationResult } from '@/types/skills';

// Initialize Ajv with strict mode and format validation
const ajv = new Ajv({
    allErrors: true,
    strict: true,
    validateFormats: true,
    removeAdditional: false, // Don't remove additional properties
    useDefaults: true, // Apply default values from schema
});

// Add format validators (email, url, date, etc.)
addFormats(ajv);

/**
 * Validate input data against a JSON Schema
 */
export function validateInput(
    input: any,
    schema: JSONSchema
): ValidationResult {
    try {
        const validate: ValidateFunction = ajv.compile(schema);
        const valid = validate(input);

        if (!valid && validate.errors) {
            const errors = validate.errors.map(err => {
                const path = err.instancePath || 'root';
                return `${path}: ${err.message}`;
            });

            return { valid: false, errors };
        }

        return { valid: true, errors: [] };
    } catch (error) {
        return {
            valid: false,
            errors: [`Schema compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
    }
}

/**
 * Validate output data against a JSON Schema
 */
export function validateOutput(
    output: any,
    schema: JSONSchema
): ValidationResult {
    return validateInput(output, schema);
}

/**
 * Validate data size (prevent huge payloads)
 */
export function validateSize(
    data: any,
    maxSizeKB: number = 100
): ValidationResult {
    try {
        const jsonString = JSON.stringify(data);
        const sizeKB = jsonString.length / 1024;

        if (sizeKB > maxSizeKB) {
            return {
                valid: false,
                errors: [`Data size (${sizeKB.toFixed(2)}KB) exceeds maximum (${maxSizeKB}KB)`]
            };
        }

        return { valid: true, errors: [] };
    } catch (error) {
        return {
            valid: false,
            errors: [`Size validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
    }
}

/**
 * Validate that input matches schema and size constraints
 */
export function validateSkillInput(
    input: any,
    schema: JSONSchema,
    maxSizeKB: number = 10
): ValidationResult {
    // Check size first (cheaper operation)
    const sizeResult = validateSize(input, maxSizeKB);
    if (!sizeResult.valid) {
        return sizeResult;
    }

    // Then validate schema
    return validateInput(input, schema);
}

/**
 * Validate that output matches schema and size constraints
 */
export function validateSkillOutput(
    output: any,
    schema: JSONSchema,
    maxSizeKB: number = 100
): ValidationResult {
    // Check size first
    const sizeResult = validateSize(output, maxSizeKB);
    if (!sizeResult.valid) {
        return sizeResult;
    }

    // Then validate schema
    return validateOutput(output, schema);
}

/**
 * Validate a JSON Schema itself (meta-validation)
 */
export function validateSchema(schema: any): ValidationResult {
    try {
        // Try to compile the schema
        ajv.compile(schema);
        return { valid: true, errors: [] };
    } catch (error) {
        return {
            valid: false,
            errors: [`Invalid schema: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
    }
}

/**
 * Create a simple schema validator for common types
 */
export function createSimpleSchema(
    type: 'string' | 'number' | 'boolean' | 'object' | 'array',
    required: boolean = true
): JSONSchema {
    const schema: JSONSchema = { type };

    if (type === 'object') {
        schema.properties = {};
        schema.additionalProperties = true;
    }

    if (type === 'array') {
        schema.items = { type: 'string' };
    }

    return schema;
}

/**
 * Merge validation results
 */
export function mergeValidationResults(
    ...results: ValidationResult[]
): ValidationResult {
    const allErrors = results.flatMap(r => r.errors);
    return {
        valid: allErrors.length === 0,
        errors: allErrors
    };
}
