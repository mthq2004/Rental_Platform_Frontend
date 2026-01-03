// src/components/auth/ProtectedRoute.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { getProfileUser } from "../../stores/slices/auth.slice";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuth, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    
    if (!accessToken) {
      navigate("/");
      return;
    }

    if (!isAuth && accessToken) {
      dispatch(getProfileUser());
    }
  }, [dispatch, isAuth, navigate]);

  // if (loading) {
  //   return <div className="flex items-center justify-center h-screen">
  //     <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
  //   </div>;
  // }

  return isAuth ? <>{children}</> : null;
};