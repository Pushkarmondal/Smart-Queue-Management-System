import axios from 'axios';
import { describe, test, expect } from '@jest/globals';
import { BACKEND_URL } from '../config';

describe("Auth", () => {
    test("This is login test for one user per email", async () => {
        const email = "nishit69@gmail.com";
        const password = "123456";

        const response = await axios.post(`${BACKEND_URL}/login`, 
            {
                email,
                password
            });
        expect(response.status).toBe(200);
    });
});