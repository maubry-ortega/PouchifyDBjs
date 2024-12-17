import pouchdbFindPlugin from "pouchdb-find";
import PouchDB from "pouchdb-core";
import "pouchdb-adapter-memory";
import { v4 as uuidv4 } from "uuid";
import { Schema } from './Schema';

// Initialize PouchDB with the find plugin
PouchDB.plugin(pouchdbFindPlugin);

interface RelatedModel<T extends Document> {
  findOne(id: string): Promise<T | null>;
}

export abstract class PouchifyModel<T extends Document> {
  static db: PouchDB.Database;
  static schema: Schema;

  /**
   * Configura la base de datos para el modelo.
   */
  static setDatabase(dbInstance: PouchDB.Database): void {
    this.db = dbInstance;
  }

  static getDatabase(): PouchDB.Database {
    if (!this.db) throw new Error("Database not initialized");
    return this.db;
  }

  /**
   * Genera un ID único si no se especifica uno.
   */
  private static generateId(data: Document): string {
    return data._id || uuidv4(); // Genera un UUID si no se proporciona _id
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
    if (!this.schema) throw new Error("Schema not defined for this model");

    // Aplica validación usando el esquema
    const { valid, errors } = this.schema.validate(data);
    if (!valid) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }
  }

  /**
   * Guarda un nuevo documento en la base de datos.
   */
  static async save<T extends Document>(data: T): Promise<T> {
    if (!this.db) throw new Error("Database not initialized");

    // Asegurarse de que se asigna un _id si no está presente
    if (!data._id) {
      data._id = uuidv4();
    }

    // Siempre valida los datos antes de proceder
    this.validate(data); // Validación que falla si no hay _id

    try {
      // Intenta obtener el documento existente
      const existingDoc = await this.db.get(data._id!);
      // Merge del documento existente con los nuevos datos
      const updatedDoc = { ...existingDoc, ...data, _id: data._id, _rev: existingDoc._rev };
      const response = await this.db.put(updatedDoc);
      return { ...updatedDoc, _id: response.id, _rev: response.rev } as T;
    } catch (err: any) {
      if (err.status === 404) {
        // Si no existe, crea un nuevo documento
        const response = await this.db.put(data);
        return { ...data, _id: response.id, _rev: response.rev } as T;
      }
      throw err;
    }
  }

  /**
   * Carga relaciones basadas en esquemas.
   */
  static async populate<T extends Document>(doc: T): Promise<T> {
      if (!this.db) throw new Error("Database not initialized");
      if (!this.schema) throw new Error("Schema not defined for this model");

      const populatedDoc = { ...doc };

      for (const [key, field] of Object.entries(this.schema.getDefinition())) {
        if (typeof field.ref === 'function' && 'findOne' in field.ref) {
          const relatedModel = field.ref as RelatedModel<Document>;
          // si la relacion es 1:N (array de ids)
          if (Array.isArray(doc[key])) {
            (populatedDoc as any)[key] = await Promise.all (
              (doc[key] as string[]).map(id => relatedModel.findOne(id))
            );
        }

        // si es de 1: 1 (un unico id)
        else if (doc[key]) {
          (populatedDoc as any)[key] = await relatedModel.findOne(doc[key]);        }
      } else {
        throw new Error(`Invalid reference field: ${key}`);
      }
    }

    return populatedDoc;
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
  static async delete<T extends Document>(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
  
    try {
      const doc = await this.db.get(id);
      await this.db.remove(doc);
    } catch (err: any) {
      if (err.status === 404) {
        throw new Error(`No se encontró el documento con ID: ${id}`);
      }
      throw err;
    }
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
    
    try {
      const result = await this.db.find({ selector });
      return result.docs as T[];
    } catch (err: any) {
      throw new Error(`Error en la consulta: ${err.message}`);
    }
  }
}