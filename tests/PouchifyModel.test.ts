import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import PouchDB from "pouchdb-core";
import "pouchdb-adapter-memory";  // Asegúrate de que el adaptador idb esté importado
import "pouchdb-find";          // Importa pouchdb-find para usar las consultas
import { PouchifyModel } from "../src/core/PouchifyModel";

// almacen en memoria
PouchDB.plugin(require("pouchdb-adapter-memory")); 

// Configuración de las pruebas
const dbName = "test_db";
const testDocs = [
    { name: "Test User", age: 25 },
    { name: "Test User 2", age: 30 },
];

describe("PouchifyModel", () => {
    let db: PouchDB.Database;

    beforeAll(async () => {
        db = new PouchDB(dbName);
        PouchifyModel.setDatabase(db);
    
        // Crear índice para consultas avanzadas
        // await db.createIndex({ index: { fields: ["name"] } });
    });

    beforeEach(async () => {
        // Eliminar documentos previos para pruebas limpias
        const allDocs = await db.allDocs({ include_docs: true });
        const deletions = allDocs.rows.map((row) => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true,
        }));
        if (deletions.length) await db.bulkDocs(deletions);

        // Crear documentos de prueba
        await Promise.all(testDocs.map((doc) => PouchifyModel.save(doc)));
    });

    it("Debería guardar un documento", async () => {
        const doc = await PouchifyModel.save({ name: "New User", age: 22 });
        expect(doc).toHaveProperty("_id");
        expect(doc).toHaveProperty("_rev");
        expect(doc.name).toBe("New User");
    });

    it("Debería obtener un documento por ID", async () => {
        const [doc] = await PouchifyModel.find({ selector: { name: "Test User" } });
        if (doc && doc._id) {
            const foundDoc = await PouchifyModel.findOne(doc._id);
            expect(foundDoc).toHaveProperty("name", "Test User");
            expect(foundDoc).toHaveProperty("age", 25);
        } else {
            // Handle the case where no document is found
            throw new Error("Documento no encontrado");
        }
    });
    
    it("Debería eliminar un documento", async () => {
        const [doc] = await PouchifyModel.find({ selector: { name: "Test User" } });
        if (doc && doc._id) {
            await PouchifyModel.remove(doc._id);
            try {
                const deletedDoc = await db.get(doc._id);
                // Si el documento sigue existiendo, debería lanzar un error
                throw new Error('El documento no fue eliminado');
            } catch (err) {
                // PouchDB lanza un error con 'status' igual a 404 cuando un documento no es encontrado
                expect(err).toHaveProperty('status', 404);
            }
        } else {
            // Handle the case where no document is found
            throw new Error("Documento no encontrado");
        }
    });

    it("Debería obtener todos los documentos", async () => {
        const docs = await PouchifyModel.findAll();
        expect(docs).toHaveLength(testDocs.length);
        expect(docs[0]).toHaveProperty("name");
    });

    it("Debería actualizar un documento", async () => {
        const [doc] = await PouchifyModel.find({ selector: { name: "Test User" } });
        if (doc && doc._id) {
            const updatedDoc = await PouchifyModel.update(doc._id, { age: 35 });
            expect(updatedDoc).toHaveProperty("age", 35);
        } else {
            // Handle the case where doc or doc._id is undefined
            throw new Error("Documento no encontrado");
        }
    });

    it("Debería realizar una consulta avanzada", async () => {
        const results = await PouchifyModel.query({ name: { $eq: "Test User" } });
        expect(results).toHaveLength(1);
        expect(results[0]).toHaveProperty("name", "Test User");
    });

    it("Debería lanzar un error si la validación falla", async () => {
        await expect(
            PouchifyModel.save({ name: 'Test', value: 'not a number' })
        ).rejects.toThrow('El campo "value" debe ser un número.');
    });
});
