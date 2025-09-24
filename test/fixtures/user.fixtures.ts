import { v4 as uuid } from "uuid";
import * as bcrypt from "bcrypt";

export const getUserFixtures = async (): Promise<Partial<any[]>> => {
  const passwordHash = await bcrypt.hash("password123", 10);

  return [
    {
      id: uuid(),
      email: "testuser1@test.com",
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuid(),
      email: "testuser2@test.com",
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
};
