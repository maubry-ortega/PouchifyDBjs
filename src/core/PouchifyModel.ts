import pouchdbFindPlugin from "pouchdb-find";
import PouchDB from "pouchdb-core";
import "pouchdb-adapter-memory";
import { v4 as uuidv4 } from "uuid";

// Initialize PouchDB with the find plugin
PouchDB.plugin(pouchdbFindPlugin);

export interface Document {
  _id?: string;
  _rev?: string;
  [key: string]: any;
}

export abstract class PouchifyModel<T extends Document> {
  static db: PouchDB.Database;

  /**
   * Configura la base de datos para el modelo.
   */
  static setDatabase(dbInstance: PouchDB.Database): void {
    this.db = dbInstance;
  }

  /**
   * Genera un ID único si no se especifica uno.
   */
  private static generateId(data: Document): string {
    return data._id || uuidv4();
  }

  /**
   * Validación generica de datos.
   * sobreescrita por cada modelo específico
   */
  protected static validate(data: Document): void {
    console.log("Validando datos:", data);

    // Validaciones generales
    if (!data._id) {
        data._id = this.generateId(data);
    }

    // Validación específica de 'value'
    if (data.value !== undefined) {
        if (typeof data.value !== 'number') {
            throw new Error('El campo "value" debe ser un número.');
        }
    }
  }

  /**
   * Guarda un nuevo documento en la base de datos.
   */
  static async save<T extends Document>(data: T): Promise<T> {
    if (!this.db) throw new Error("Database not initialized");

    // Siempre valida los datos antes de proceder
    this.validate(data); // Validación que falla si no hay _id

    try {
        // Intenta obtener el documento existente
        const existingDoc = await this.db.get(data._id!);
        const updatedDoc = { ...existingDoc, ...data };
        const response = await this.db.put(updatedDoc);
        return { ...updatedDoc, _id: response.id, _rev: response.rev } as T;
    } catch (err: any) {
        if (err.status === 404) {
            // Si el documento no existe, lo crea
            const response = await this.db.put(data);
            return { ...data, _id: response.id, _rev: response.rev } as T;
        }
        // Si hay otro error, lo lanza
        throw err;
    }
  }

  /**
   * Busca documentos que cumplan con el query dado.
   */
  static async find<T extends Document>(query: any): Promise<T[]> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.find(query);
    return result.docs as T[];
  }

  /**
   * Buscar un documento por su ID.
   */
  static async findOne<T extends Document>(id: string): Promise<T | null> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const doc = await this.db.get(id);
      return doc as T;
    } catch (err : any) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  /**
   * Eliminar un documento por su ID.
   */
  static async remove<T extends Document>(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    const doc = await this.db.get(id);
    await this.db.remove(doc);
  }

  /**
   * Obtener todos los documentos.
   */
  static async findAll<T extends Document>(): Promise<T[]> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.allDocs({ include_docs: true });
    return result.rows.map((row) => row.doc as T);
  }

  /**
   * Actualizar un documento por su ID.
   */
  static async update<T extends Document>(id: string, data: Partial<T>): Promise<T> {
    if (!this.db) throw new Error("Database not initialized");
    const doc = await this.db.get(id);
    const updatedDoc = { ...doc, ...data, _id: id };
    const response = await this.db.put(updatedDoc);
    return { ...updatedDoc, _rev: response.rev } as T;
  }

  /**
   * Consultas avanzadas.
   */
  static async query<T extends Document>(selector: PouchDB.Find.Selector): Promise<T[]> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.find({ selector });
    return result.docs as T[];
  }
}