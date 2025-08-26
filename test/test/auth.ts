import axios from "axios";

export const createTestUserAndGetToken = async () => {
  const email = `testuser_${Date.now()}@example.com`;
  const password = "123456";

  await axios.post("http://localhost:3002/api/v1/signup", {
    name: "Test User",
    email,
    password,
  });

  const loginRes = await axios.post("http://localhost:3002/api/v1/login", {
    email,
    password,
  });

  return loginRes.data.token;
};
