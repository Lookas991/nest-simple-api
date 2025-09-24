import { v4 as uuid } from "uuid";

export const getTaskFixtures = (projectId: string): any[] => {
  const now = new Date();

  return [
    // Only required fields
    {
      id: uuid(),
      title: "Basic Task",
      projectId,
      createdAt: now,
      updatedAt: now,
    },

    // Full props
    {
      id: uuid(),
      title: "Important backend refactor",
      description: "Refactor the NestJS modules and services",
      done: true,
      dueDate: new Date(now.getTime() + 3 * 86400000), // 3 days from now
      projectId,
      createdAt: now,
      updatedAt: now,
    },

    // Completed task, no description
    {
      id: uuid(),
      title: "Fix login issue",
      done: true,
      dueDate: new Date(now.getTime() - 86400000), // yesterday
      projectId,
      createdAt: now,
      updatedAt: now,
    },

    // With description but no due date or status
    {
      id: uuid(),
      title: "Set up Swagger docs",
      description: "Add OpenAPI decorators for all endpoints",
      projectId,
      createdAt: now,
      updatedAt: now,
    },

    // Another one to test sorting/searching
    {
      id: uuid(),
      title: "Write unit tests for tasks service",
      description: "Ensure 90%+ coverage",
      dueDate: new Date(now.getTime() + 5 * 86400000),
      projectId,
      createdAt: now,
      updatedAt: now,
    },
  ];
};
