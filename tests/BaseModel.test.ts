import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import PouchDB from "pouchdb-core";
import "pouchdb-adapter-idb";  // Asegúrate de que el adaptador idb esté importado
import "pouchdb-find";          // Importa pouchdb-find para usar las consultas
import { BaseModel } from "../src/core/BaseModel";

// Habilitar el plugin de IndexedDB
PouchDB.plugin(require("pouchdb-adapter-idb"));

// Configuración de las pruebas
const dbName = "test_db";
const testDocs = [
    { name: "Test User", age: 25 },
    { name: "Test User 2", age: 30 },
];

describe("BaseModel", () => {
    let db: PouchDB.Database;

    beforeAll(async () => {
        // Usa el adaptador "idb" para IndexedDB
        db = new PouchDB(dbName, { adapter: "idb" });
        BaseModel.setDatabase(db);
    
        // Crear índice para consultas avanzadas
        await db.createIndex({ index: { fields: ["name"] } });
    });

    beforeEach(async () => {
        // Eliminar documentos previos para pruebas limpias
        const allDocs = await db.allDocs({ include_docs: true });
        const deletions = allDocs.rows.map((row) => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true,
        }));
        if (deletions.length > 0) await db.bulkDocs(deletions);

        // Crear documentos de prueba
        await Promise.all(testDocs.map((doc) => BaseModel.save(doc)));
    });

    it("Debería guardar un documento", async () => {
        const doc = await BaseModel.save({ name: "New User", age: 22 });
        expect(doc).toHaveProperty("_id");
        expect(doc).toHaveProperty("_rev");
        expect(doc.name).toBe("New User");
    });

    it("Debería obtener un documento por ID", async () => {
        const [doc] = await BaseModel.find({ selector: { name: "Test User" } });
        const foundDoc = await BaseModel.findOne(doc._id);
        expect(foundDoc).toHaveProperty("name", "Test User");
        expect(foundDoc).toHaveProperty("age", 25);
    });

    it("Debería eliminar un documento", async () => {
        const [doc] = await BaseModel.find({ selector: { name: "Test User" } });
        await BaseModel.remove(doc._id);
        try {
            const deletedDoc = await db.get(doc._id);
            // Si el documento sigue existiendo, debería lanzar un error
            throw new Error('El documento no fue eliminado');
        } catch (err) {
            // PouchDB lanza un error con 'status' igual a 404 cuando un documento no es encontrado
            expect(err).toHaveProperty('status', 404);
        }
    });

    it("Debería obtener todos los documentos", async () => {
        const docs = await BaseModel.findAll();
        expect(docs).toHaveLength(testDocs.length);
        expect(docs[0]).toHaveProperty("name");
    });

    it("Debería actualizar un documento", async () => {
        const [doc] = await BaseModel.find({ selector: { name: "Test User" } });
        const updatedDoc = await BaseModel.update(doc._id, { age: 35 });
        expect(updatedDoc).toHaveProperty("age", 35);
    });

    it("Debería realizar una consulta avanzada", async () => {
        const results = await BaseModel.query({ name: { $eq: "Test User" } });
        expect(results).toHaveLength(1);
        expect(results[0]).toHaveProperty("name", "Test User");
    });

    it("Debería lanzar un error si la validación falla", async () => {
        await expect(BaseModel.save({})).rejects.toThrow();
    });
});
