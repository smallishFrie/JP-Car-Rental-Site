import "server-only";

export function readServerEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function readOptionalServerEnv(name: string) {
  return process.env[name] ?? "";
}
