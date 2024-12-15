import PouchDB from "pouchdb-core";
import "pouchdb-adapter-idb";
import "pouchdb-find";
import { v4 as uuidv4 } from "uuid";

export abstract class BaseModel {
    static db: PouchDB.Database;

    /**
     * Configura la base de datos para el modelo.
     */
    static setDatabase(dbInstance: PouchDB.Database) {
        this.db = dbInstance;
    }

    /**
     * Genera un ID único si no se especifica uno.
     */
    private static generateId(data: Record<string, any>): string {
        return data._id || uuidv4();
    }

    /**
     * Guarda un nuevo documento en la base de datos.
     */
    static async save(data: Record<string, any>) {
        if (!this.db) throw new Error("Database not initialized");
        this.validate(data);
    
        data._id = this.generateId(data); // Genera el _id automáticamente si no existe
    
        try {
            const existingDoc = await this.db.get(data._id);
            const updatedDoc = { ...existingDoc, ...data };
            const response = await this.db.put(updatedDoc);
            return { ...updatedDoc, _id: response.id, _rev: response.rev };
        } catch (err: any) {
            if (err.status === 404) {
                const response = await this.db.put(data);
                console.log("Documento guardado:", response); // Verifica el documento guardado
                return { ...data, _id: response.id, _rev: response.rev };
            }
            throw err;
        }
    }

    /**
     * Busca documentos que cumplan con el query dado.
     */
    static async find(query: PouchDB.Find.FindRequest<{}>) {
        if (!this.db) throw new Error("Database not initialized");
        const result = await this.db.find(query);
        return result.docs;
    }

    /**
     * Buscar un documento por su ID
     */
    static async findOne(id: string) {
        if (!this.db) throw new Error("Database not initialized");
        return this.db.get(id);
    }

    /**
     * Eliminar un documento por su ID
     */
    static async remove(id: string) {
        if (!this.db) throw new Error("Database not initialized");
        const doc = await this.db.get(id);
        return this.db.remove(doc);
    }

    /**
     * Obtener todos los documentos
     */
    static async findAll(): Promise<any[]> {
        const result = await this.db.allDocs({ include_docs: true });
        return result.rows.map((row) => row.doc);
    }

    /**
     * Actualizar un documento por su ID
     */
    static async update(id: string, data: any): Promise<any> {
        if (!this.db) throw new Error("Database not initialized");
        const doc = await this.db.get(id);
        const updatedDoc = { ...doc, ...data, _id: id };
        const response = await this.db.put(updatedDoc);
        return { ...updatedDoc, _rev: response.rev };
    }

    /**
     * Consultas avanzadas
     */
    static async query(selector: any): Promise<any[]> {
        const result = await this.db.find({ selector });
        return result.docs;
    }

    /**
     * Validar un documento según reglas predefinidas (placeholder).
     */
    private static validate(data: any): void {
        // Validaciones ejemplo; personalizar según el esquema.
        if (!data.name || typeof data.name !== "string") {
            throw new Error('El campo "name" es obligatorio y debe ser un string.');
        }
        if (typeof data.age !== "number") {
            throw new Error('El campo "age" es obligatorio y debe ser un número.');
        }
    }
}