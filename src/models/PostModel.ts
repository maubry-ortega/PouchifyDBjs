import { Schema } from "../core/Schema";
import { PouchifyModel } from "../core/PouchifyModel";

const postSchema = new Schema({
    title: { type: "string", required: true },
    content: { type: "string" },
    author: { type: "string", ref: 'UserModel' }, // Relación 1:1 con UserModel
    tags: { type: "array", ref: 'TagModel' },    // Relación N:N con TagModel
});

export class PostModel extends PouchifyModel<Document> {
    static schema = postSchema;
}