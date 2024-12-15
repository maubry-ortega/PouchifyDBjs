import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import PouchDB from "pouchdb-core";
import "pouchdb-adapter-memory"; // Asegúrate de que el adaptador esté importado
import "pouchdb-find";          // Importa pouchdb-find para consultas
import { UserModel } from "../src/models/UserModel";

// Configuración del adaptador en memoria
PouchDB.plugin(require("pouchdb-adapter-memory"));

const dbName = "test_user_db";
const testUsers = [
    { name: "Alice", age: 25, email: "alice@example.com" },
    { name: "Bob", age: 30, email: "bob@example.com" },
];

describe("UserModel", () => {
    let db: PouchDB.Database;

    beforeAll(async () => {
        db = new PouchDB(dbName);
        UserModel.setDatabase(db); // Configura la base de datos para el modelo
    });

    beforeEach(async () => {
        const allDocs = await db.allDocs({ include_docs: true });
        const deletions = allDocs.rows.map(row => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true
        }));
        if (deletions.length) await db.bulkDocs(deletions);
    
        // Asegúrate de que los usuarios de prueba no se inserten de nuevo si la base de datos está limpia
        await Promise.all(testUsers.map(user => UserModel.save(user)));
    });

    it("Debería guardar un usuario válido", async () => {
        const user = { name: "Charlie", age: 22, email: "charlie@example.com" };  // Incluye email
        const savedUser = await UserModel.save(user);
        expect(savedUser).toHaveProperty("_id");
        expect(savedUser).toHaveProperty("_rev");
        expect(savedUser.name).toBe("Charlie");
        expect(savedUser.email).toBe("charlie@example.com");
    });

    it("Debería lanzar un error al guardar un usuario inválido", async () => {
        const invalidUser = { name: "", age: "not a number", email: "" };  // name vacío, age incorrecto y email vacío
        
        // Ejecutar el guardado y capturar el error
        await expect(UserModel.save(invalidUser as any)).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Validación fallida: Field "name" is required, Field "email" is required, Field "age" must be of type number]`);
    });
    
    
    it("Debería buscar un usuario por ID", async () => {
        const [user] = await UserModel.find({ selector: { name: "Alice" } });
        if (user && user._id) {
            const foundUser = await UserModel.findOne(user._id);
            expect(foundUser).toHaveProperty("name", "Alice");
            expect(foundUser).toHaveProperty("age", 25);
        } else {
            throw new Error("Usuario no encontrado");
        }
    });

    it("Debería eliminar un usuario", async () => {
        const [user] = await UserModel.find({ selector: { name: "Alice" } });
        if (user && user._id) {
            await UserModel.remove(user._id);
            const deletedUser = await UserModel.findOne(user._id);
            expect(deletedUser).toBeNull(); // Debe retornar null
        } else {
            throw new Error("Usuario no encontrado");
        }
    });

    it("Debería listar todos los usuarios", async () => {
        const users = await UserModel.findAll();
        expect(users).toHaveLength(testUsers.length);
        expect(users[0]).toHaveProperty("name");
    });

    it("Debería actualizar un usuario", async () => {
        const [user] = await UserModel.find({ selector: { name: "Alice" } });
        if (user && user._id) {
            const updatedUser = await UserModel.update(user._id, { age: 35 });
            expect(updatedUser).toHaveProperty("age", 35);
        } else {
            throw new Error("Usuario no encontrado");
        }
    });

    it("Debería realizar consultas avanzadas", async () => {
        const results = await UserModel.query({ age: { $gte: 30 } });
        expect(results).toHaveLength(1);
        expect(results[0]).toHaveProperty("name", "Bob");
    });
});
