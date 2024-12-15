export type SchemasDefinition = {
    [key: string]: {
        type : any;
        required?: boolean;
        default?: any;
        validate?: (value : any) => boolean | string;
    };
};

export class Schema {
    private definition: SchemasDefinition;

    constructor(definition: SchemasDefinition) {
        this.definition = definition;
    }

    validate(data: Record<string, any>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        for (const key in this.definition) {
            const field = this.definition[key];
            const value = data[key];

            // Validar campos requeridos
            if (field.required && (value === undefined || value === null || value === "")) {
                errors.push(`Field "${key}" is required`);
                continue;
            }

            // Validar tipo de dato
            if (value !== undefined && value !== null && typeof value !== field.type) {
                errors.push(`Field "${key}" must be of type ${field.type}`);
                continue;
            }

            // Validar con validación personalizada
            if (field.validate && value !== undefined) {
                const isValid = field.validate(value);
                if (isValid !== true) {
                    // Asegúrate de que el error siempre sea una cadena
                    errors.push(typeof isValid === 'string' ? isValid : 'Validation failed');
                }
            }            
        }

        return {
            valid: errors.length === 0,
            errors,
        };
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