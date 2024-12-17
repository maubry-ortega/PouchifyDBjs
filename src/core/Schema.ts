import { SchemasDefinition } from "../utils/types";

export class Schema {
    private definition: SchemasDefinition;

    constructor(definition: SchemasDefinition) {
        this.definition = definition;
    }

    getDefinition(): SchemasDefinition {
        return this.definition;
    }

    validate(data: Record<string, any>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        for (const key in this.definition) {
            const field = this.definition[key];
            const value = data[key];

        if (field.required && (value === undefined || value === null || value === "")) {
            errors.push(`Field "${key}" is required`);
            continue;
        }

        // validar tipo
        if (value !== undefined && field.type !== "array" && typeof value !== field.type) {
            errors.push(`Field "${key}" must be of type ${field.type}`);
            continue;
        }

        if (field.ref && value !== undefined) {
            if (Array.isArray(value) && field.type === "array") {
                if (!value.every( v => typeof v === "string")) {
                    errors.push(`Field "${key}" must be an array of strings`);
                }
            } else if (typeof value !== "string") {
                errors.push(`Field "${key}" must be a string`);
            }
        }

        if (field.validate && value !== undefined) {
            const isValid = field.validate(value);
            if (isValid !== true) {
                errors.push(typeof isValid === "string" ? isValid : "Validation failed");
            }
        }
    }

      return { valid: errors.length === 0, errors };
    }
  
    applyDefaults(data: Record<string, any>): Record<string, any> {
      for (const key in this.definition) {
        const field = this.definition[key];
        if (data[key] === undefined && field.default !== undefined) {
          data[key] = typeof field.default === "function" ? field.default() : field.default;
        }
      }
      return data;
    }
  }