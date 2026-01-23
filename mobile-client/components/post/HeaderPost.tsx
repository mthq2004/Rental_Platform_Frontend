import { useAppDispatch, useAppSelector } from "@/store/hook";
import { createProperty, createPropertySaveDraft, resetMessage } from "@/store/slices/property.slice";
import { PropertyFormData } from "@/types/property.type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface StepProps {
    formData: PropertyFormData,
    showToast: (message: any, type: any) => void
}

const HeaderPost = ({ formData, showToast }: StepProps) => {
    const { loading, property, message } = useAppSelector(state => state.property)
    const dispatch = useAppDispatch()
    const handleSaveDraft = () => {
        formData.status = "draft"
        console.log("xian: ", formData);
        
        dispatch(createPropertySaveDraft(formData))
    }

    const handleClose = () => {
        router.replace("/(tab)")
    }

    return (
        <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
                <TouchableOpacity onPress={handleClose} className="p-2">
                    <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Đăng bất động sản</Text>
                <TouchableOpacity className="px-4 py-2 bg-gray-100 rounded-lg" onPress={handleSaveDraft}>
                    <Text className="text-sm font-semibold text-gray-700">Lưu nháp</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}


export default HeaderPost