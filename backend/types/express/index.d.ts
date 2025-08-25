import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: any; // or a more specific type like `JwtPayload`
  }
}
