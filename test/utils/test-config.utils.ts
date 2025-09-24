export const setTestEnv = (config: Record<string, string>) => {
  for (const key in config) {
    process.env[key] = config[key];
  }
};
