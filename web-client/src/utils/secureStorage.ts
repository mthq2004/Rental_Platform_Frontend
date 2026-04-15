"use client";
import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const IS_SECURE = process.env.NODE_ENV === 'production';

/**
 * Get the access token from cookies
 */
export const getAccessToken = (): string | null => {
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
};

/**
 * Set the access token in cookies
 */
export const setAccessToken = (token: string): void => {
    Cookies.set(ACCESS_TOKEN_KEY, token, {
        secure: IS_SECURE,
        sameSite: "strict",
        expires: 7, // 7 days
    });
};

/**
 * Remove the access token from cookies
 */
export const removeAccessToken = (): void => {
    Cookies.remove(ACCESS_TOKEN_KEY);
};

/**
 * Get the refresh token from cookies
 */
export const getRefreshToken = (): string | null => {
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
};

/**
 * Set the refresh token in cookies
 */
export const setRefreshToken = (token: string): void => {
    Cookies.set(REFRESH_TOKEN_KEY, token, {
        secure: IS_SECURE,
        sameSite: "strict",
        expires: 30, // 30 days
    });
};

/**
 * Remove the refresh token from cookies
 */
export const removeRefreshToken = (): void => {
    Cookies.remove(REFRESH_TOKEN_KEY);
};

/**
 * Clear all tokens
 */
export const clearTokens = (): void => {
    removeAccessToken();
    removeRefreshToken();
};

/**
 * Check if user is authenticated (has access token)
 */
export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};
