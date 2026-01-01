export const getEnv = (key: string) => {
  const e = process.env[key];
  if (!e) throw new Error(`No environment variable "${key}"`);
  return e;
};
