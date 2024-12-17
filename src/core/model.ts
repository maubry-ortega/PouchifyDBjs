import { Schema } from "./Schema";
import { dbInstance } from "./database";
import { Document } from "../utils/types";
import { generateUUID } from "../utils/helpers";

export abstract class PouchifyModel<T extends Document> {
    static db: PouchDB.Database = dbInstance;
    static schema: Schema;

    /**
   * Configura la base de datos para el modelo.
   */
    static setDatabase(db: PouchDB.Database): void {
        this.db = db;
    }

    static getDatabase(): PouchDB.Database {
        if (!this.db) throw new Error("Database not initialized");
        return this.db;
    }

    /**
    * Genera un ID único si no se especifica uno.
    */
    private static generateId(data: Document): string {
        return data._id || generateUUID();
    }

    /**
   * Validación generica de datos.
   * sobreescrita por cada modelo específico
   */
    protected static validate(data: Document): void {
        if (!this.schema) throw new Error("Schema not defined for this model");
        const { valid, errors } = this.schema.validate(data);
        if (!valid) throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    /**
   * Guarda un nuevo documento en la base de datos.
   */
    static async save<T extends Document>(data: T): Promise<T> {
        this.validate(data);
        data._id = this.generateId(data);
        const response = await this.db.put(data);
        return { ...data, _id: response.id, _rev: response.rev } as T;
    }

    
    static async findOne<T extends Document>(id: string): Promise<T | null> {
        try {
            return (await this.db.get(id)) as T;
        } catch (err: any) {
            if (err.status === 404) return null;
            throw err;
        }
    }

  static async delete(id: string): Promise<void> {
    const doc = await this.db.get(id);
    await this.db.remove(doc);
  }
}