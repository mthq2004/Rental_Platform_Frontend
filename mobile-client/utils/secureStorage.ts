import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const saveAccessToken = async (token: string) =>
  SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);

export const getAccessToken = async () =>
  SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

export const saveRefreshToken = async (token: string) =>
  SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);

export const getRefreshToken = async () =>
  SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const clearAuthStorage = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};
