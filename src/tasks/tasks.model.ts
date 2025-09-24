import { Document } from "mongoose";

export interface TasksDocument extends Document {
  _id: string;
  id: string;
  title: string;
  description?: string;
  done?: boolean;
  dueDate?: Date;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}
