import axios from "axios";

export let jwtToken: string;

export const setupTestUser = async () => {
  const email = "testuser1@example.com";
  const password = "123456";

  try {
    await axios.post("http://localhost:3002/api/v1/signup", {
      name: "Test User",
      email,
      password,
    });
  } catch (err) {
  }
  const loginRes = await axios.post("http://localhost:3002/api/v1/login", {
    email,
    password,
  });

  jwtToken = loginRes.data.token;
};
