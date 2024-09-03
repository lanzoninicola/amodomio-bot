import { expressjwt } from "express-jwt";
import { Request } from "express";
import { UnauthorizedError } from "express-jwt/dist/errors/UnauthorizedError";

export const processJwtUserCard = expressjwt({
  requestProperty: "user",
  secret: process.env.JWT_SESSION,
  algorithms: ["HS256"],
});

export const processJwtUserFinal = expressjwt({
  requestProperty: "userFinal",
  secret: process.env.JWT_SESSION,
  algorithms: ["HS256"],
  credentialsRequired: false,
  getToken: (req: Request) => {
    if (!req.headers["authorization-f"]) {
      return null;
    }

    let parts = (req.headers["authorization-f"] as string).split(" ");

    if (parts.length === 2) {
      let scheme = parts[0];
      let credentials = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        return credentials;
      } else {
        throw new UnauthorizedError("credentials_bad_scheme", {
          message: "authorization-f Format is Authorization: Bearer [token]",
        });
      }
    } else {
      throw new UnauthorizedError("credentials_bad_scheme", {
        message: "authorization-f Format is Authorization: Bearer [token]",
      });
    }
  },
});

export const processJwtSafeLink = expressjwt({
  requestProperty: "userSafe",
  secret: process.env.JWT_SESSION,
  algorithms: ["HS256"],
  credentialsRequired: false,
  getToken: (req: Request) => {
    if (!req.headers["authorization-safe-link"]) {
      return null;
    }

    let parts = (req.headers["authorization-safe-link"] as string).split(" ");

    if (parts.length === 2) {
      let scheme = parts[0];
      let credentials = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        return credentials;
      } else {
        throw new UnauthorizedError("credentials_bad_scheme", {
          message:
            "authorization-safe-link Format is Authorization: Bearer [token]",
        });
      }
    } else {
      throw new UnauthorizedError("credentials_bad_scheme", {
        message:
          "authorization-safe-link Format is Authorization: Bearer [token]",
      });
    }
  },
});
