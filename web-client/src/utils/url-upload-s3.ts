import http from "./api"

export const getUploadUrl = async (fileName: string, fileType: string) => {
    const client =await http.post("/chat/upload-file", { fileName, fileType });
    return client.data;
}