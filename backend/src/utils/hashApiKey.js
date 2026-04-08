import crypto from "crypto";

export const hashApiKey = (rawKey) => {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
};