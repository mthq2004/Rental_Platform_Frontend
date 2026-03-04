import { getSignature } from "@/services/cloudinary.service"

type UploadOptions = {
  uri: string
  fileName: string
  mimeType: string
  resourceType?: "image" | "video" | "raw" | "auto"
}

export const uploadToCloudinary = async ({
  uri,
  fileName,
  mimeType,
  resourceType = "auto",
}: UploadOptions) => {
  const { timestamp, signature } = await getSignature()
  
  const formData = new FormData()

  formData.append("file", {
    uri,
    type: mimeType,
    name: fileName,
  } as any)

  formData.append("api_key", process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY!)
  formData.append("timestamp", String(timestamp))
  formData.append("signature", signature)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error?.message || "Upload failed")
  }

  return {
    fileUrl: data.secure_url,
    fileName,
    fileSize: data.bytes,
    mimeType,
    width: data.width ?? null,
    height: data.height ?? null,
    duration: data.duration ?? null,
    thumbnailUrl: data.secure_url, // tạm dùng cho image
  }
}