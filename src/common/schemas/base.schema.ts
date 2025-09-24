import { Schema, SchemaOptions } from "mongoose";
import { v4 as uuid } from "uuid";

const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(doc, ret, options) {
      ret._id = ret._id;
      // delete ret._id;
      // delete ret.__v;
    },
  },
};

export function createBaseSchema(definition = {}, options: SchemaOptions = {}) {
  return new Schema(
    {
      id: { type: String, default: () => uuid(), unique: true, required: true },
      ...definition,
    },
    {
      ...baseSchemaOptions,
      ...options,
    },
  );
}
