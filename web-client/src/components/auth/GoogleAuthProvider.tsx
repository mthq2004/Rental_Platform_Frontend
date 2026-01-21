"use client";
import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "581035767713-7nng12chng9ubtohnv4c2lbofnuco197.apps.googleusercontent.com";

interface GoogleAuthProviderWrapperProps {
    children: React.ReactNode;
}

const GoogleAuthProviderWrapper: React.FC<GoogleAuthProviderWrapperProps> = ({
    children,
}) => {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
};

export default GoogleAuthProviderWrapper;
