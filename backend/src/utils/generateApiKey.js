import crypto from "crypto";

export const generateApiKey = () => {
  const randomPart = crypto.randomBytes(24).toString("hex");
  const rawKey = `sk_proj_${randomPart}`;
  const keyPrefix = rawKey.slice(0, 12);
  return { rawKey, keyPrefix };
};