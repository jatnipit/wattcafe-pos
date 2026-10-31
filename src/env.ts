export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`missing environment variable: ${name}`);
    this.name = "MissingEnvError";
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new MissingEnvError(name);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value ? value : undefined;
}
