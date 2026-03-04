// services/cloudinary.service.js
import axios from "axios"

export const getSignature = async () => {
  console.log("klk:");
  
  const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/estate/upload/get-signature`)
  return res.data.data
}