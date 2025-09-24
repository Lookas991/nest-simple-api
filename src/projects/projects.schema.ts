import { createBaseSchema } from "../common";

export const ProjectSchema = createBaseSchema({
  title: { type: String, required: true },
  description: { type: String },
  ownerId: { type: String, required: true },
});
