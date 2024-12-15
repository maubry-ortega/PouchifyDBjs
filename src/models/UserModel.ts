// // src/models/UserModel.ts
// import { BaseModel } from "../core/BaseModel";
// import { Document } from "../core/BaseModel";

// interface User extends Document {
//   name: string;
//   age: number;
// }

// export class UserModel extends BaseModel<User> {
//   // Aquí puedes añadir validaciones específicas de User
//   static validate(data: User): void {
//     if (!data.name || typeof data.name !== "string") {
//       throw new Error('El campo "name" es obligatorio y debe ser un string.');
//     }
//     if (typeof data.age !== "number") {
//       throw new Error('El campo "age" es obligatorio y debe ser un número.');
//     }
//   }
// }
