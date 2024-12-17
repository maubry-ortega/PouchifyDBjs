import pouchdbFindPlugin from "pouchdb-find";
import PouchDB from "pouchdb-core";
import "pouchdb-adapter-memory";

// Inicializa PouchDB con el plugin de consultas
PouchDB.plugin(pouchdbFindPlugin);

export const dbInstance = new PouchDB("my-odm-database");

export default PouchDB;