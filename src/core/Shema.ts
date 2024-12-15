export type SchemasDefinition = {
    [key: string]: {
        type : any;
        required?: boolean;
        default?: any;
        validate?: (value : any) => boolean | string;
    };
};