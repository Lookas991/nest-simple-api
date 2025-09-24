import { Document } from "mongoose";

export interface ProjectsDocument extends Document {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
