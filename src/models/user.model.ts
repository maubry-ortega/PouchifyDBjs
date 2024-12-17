import { PouchifyModel } from "../core/model";
import { Schema } from "../core/Schema";

const userSchema = new Schema({
  name: { type: "string", required: true },
  email: { type: "string", required: true, validate: (val) => val.includes("@") || "Invalid email" },
});

export class UserModel extends PouchifyModel<any> {
  static schema = userSchema;
}