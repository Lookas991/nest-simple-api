import { createBaseSchema } from "../common";

export const UserSchema = createBaseSchema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
