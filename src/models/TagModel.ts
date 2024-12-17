import { Schema } from "../core/Schema";
import { PouchifyModel } from "../core/PouchifyModel";

const tagSchema = new Schema({
    name: { type: "string", required: true },
});

export class TagModel extends PouchifyModel<Document> {
    static schema = tagSchema;
}       