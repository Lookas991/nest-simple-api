import { v4 as uuid } from "uuid";

export const getProjectFixtures = (userId: string): Partial<any[]> => {
  return [
    {
      id: uuid(),
      title: "Demo Project 1",
      description: "Project for testing",
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuid(),
      title: "Demo Project 2",
      description: "Another one",
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
};
