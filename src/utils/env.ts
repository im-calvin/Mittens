import { config } from "dotenv";
config();

export const readEnv = (env: string): string => {
  const realEnv = process.env[env];
  if (realEnv !== undefined) return realEnv;

  throw new Error(`${env} was not found.`);
};
