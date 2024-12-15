import { PouchifyModel } from "../core/PouchifyModel";
import { Document } from "../core/PouchifyModel";
import { userSchema } from "../schemas/userSchema";
import { v4 as uuidv4 } from 'uuid';

export interface User extends Document {
  name: string;
  age: number;
}

export class UserModel extends PouchifyModel<User> {
    protected static validate(data: User): void {
        const dataWithDefaults = userSchema.applyDefaults(data);
      
        // Asignar un ID antes de la validación
        if (!dataWithDefaults._id) {
            dataWithDefaults._id = uuidv4(); // Generar un ID único si no lo tiene
        }
    
        // Valida el esquema
        const { valid, errors } = userSchema.validate(dataWithDefaults);
        if (!valid) {
            throw new Error(`Validación fallida: ${errors.join(", ")}`);
        }
    }
    
  }