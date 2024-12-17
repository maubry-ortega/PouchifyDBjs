export type SchemasDefinition = {
    [key: string]: {
        type: any;
        required?: boolean;
        default?: any;
        validate?: (value: any) => boolean | string;
        ref?: string; // Referencias o relaciones
    };
};

export interface Document {
    _id?: string;
    _rev?: string;
    [key: string]: any;
}

export interface RelatedModel<T extends Document> {
    findOne(id: string): Promise<T | null>;
}

export interface Field {
    ref: RelatedModel<Document>;
}

