import { Schema } from "../core/Schema";

export const userSchema = new Schema({
    name: {
        type: 'string',
        required: true,
        validate: (value) => {
            if (typeof value !== 'string') {
                return 'Field "name" is required and must be of type string';
            }
            return true;
        },
    },
    email: {
        type: 'string',
        required: true,
        validate: (value) => {
            if (typeof value !== 'string' || !/.+@.+\..+/.test(value)) {
                return 'Field "email" is required';
            }
            return true;
        },
    },
    age: {
        type: 'number',
        required: true,
        validate: (value) => {
            if (typeof value !== 'number') {
                return 'Field "age" must be of type number';
            }
            return true;
        },
    }
});