// src/components/auth/PublicRoute.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { getProfileUser } from "../../stores/slices/auth.slice";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuth, loading } = useAppSelector((state) => state.auth);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const accessToken = localStorage.getItem("accessToken");
      
      if (accessToken && !isAuth) {
        try {
          await dispatch(getProfileUser()).unwrap();
          navigate("/dashboard");
        } catch (error) {
          setChecking(false);
        }
      } else if (isAuth) {
        navigate("/dashboard");
      } else {
        setChecking(false);
      }
    };

    checkAuthStatus();
  }, [dispatch, isAuth, navigate]);

  if (checking || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  return <>{children}</>;
};