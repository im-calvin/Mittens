import { config } from "dotenv-vault-core";
config();

export const readEnv = (env: string): string => {
  const realEnv = process.env[env];
  if (realEnv !== undefined) return realEnv;

  throw new Error(`${env} was not found.`);
};
