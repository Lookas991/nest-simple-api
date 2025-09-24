import { createBaseSchema } from "../common";

export const TaskSchema = createBaseSchema({
  title: { type: String, required: true },
  description: { type: String },
  done: { type: Boolean, default: false },
  dueDate: { type: Date },
  projectId: { type: String, required: true },
});
