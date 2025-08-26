// queue.test.ts
import axios from "axios";
import { describe, test, beforeAll, expect } from "@jest/globals";
import { setupTestUser, jwtToken } from "./auth";
import { BACKEND_URL } from "../config";

beforeAll(async () => {
  await setupTestUser();
});

describe("Queue Tests", () => {
  test("Create queue", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/create-queue`,
      { name: "My Queue", location: "Test Location" },
      { headers: { Authorization: `Bearer ${jwtToken}` } }
    );

    expect(response.status).toBe(201);
  });

  test("Join queue", async () => {
    const getQueue = await axios.get(`${BACKEND_URL}/queues`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
  
    const queueId = getQueue.data.queues[0].id;
    const join = await axios.post(
      `${BACKEND_URL}/queues/${queueId}/join`,
      {},
      { headers: { Authorization: `Bearer ${jwtToken}` } }
    );
  
    expect(join.status).toBe(200);
  });
  
});
