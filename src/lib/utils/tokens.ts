import { createHash, randomBytes } from "node:crypto";

/** Random URL-safe secret that goes into the emailed link. */
export const generateToken = () => randomBytes(32).toString("base64url");

/** Only this hash is stored in the database, never the token itself. */
export const hashToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");
