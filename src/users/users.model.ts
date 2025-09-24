import { Document } from "mongoose";

export interface UsersDocument extends Document {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
