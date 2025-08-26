import axios from 'axios';
import { describe, test, expect } from '@jest/globals';
import { BACKEND_URL } from '../config';
import { createTestUserAndGetToken } from './auth';

let jwtToken: string;

beforeAll(async () => {
  jwtToken = await createTestUserAndGetToken();
});

describe("Queue", () => {
    test("This is create queue test", async () => {
        const response = await axios.post(`${BACKEND_URL}/create-queue`, 
            {
                name: "Test Queue",
                location: "Test Location"
            },
            {
                headers: {
                    Authorization: `Bearer ${jwtToken}`
                }
            });
        expect(response.status).toBe(201);
    })
})
    