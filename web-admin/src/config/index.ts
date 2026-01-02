import { z } from "zod";

const configSchema = z.object({
  API_ENDPOINT: z.string().url(),
});

const configProject = configSchema.safeParse({
  API_ENDPOINT: import.meta.env.VITE_API_ENDPOINT,
});

if (!configProject.success) {
  console.error("ENV ERROR:", configProject.error.issues);
  throw new Error("Env config không hợp lệ");
}

const envConfig = configProject.data;
export default envConfig;
