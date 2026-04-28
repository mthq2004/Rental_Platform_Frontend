import z from "zod";

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

const configProject = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});
if (!configProject.success) {
  console.error(configProject.error.issues);
  throw new Error(
    "Các giá trị khai báo trong file .env không hợp lệ (thiếu NEXT_PUBLIC_API_ENDPOINT)"
  );
}

const envConfig = configProject.data;
export default envConfig;
