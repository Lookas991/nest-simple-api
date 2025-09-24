import * as request from "supertest";
import { INestApplication } from "@nestjs/common";

export const testUserCredentials = {
  email: "test1@test.com",
  password: "password1",
};

export async function registerTestUser(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post("/auth/register")
    .send(testUserCredentials)
    .expect(201);

  return response.body?.data?.access_token;
}

export async function loginTestUser(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post("/auth/login")
    .send(testUserCredentials);
  expect(201);

  return response.body?.data?.access_token;
}
