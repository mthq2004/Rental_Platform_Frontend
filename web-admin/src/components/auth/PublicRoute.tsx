// src/components/auth/PublicRoute.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { getProfileUser } from "../../stores/slices/auth.slice";

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuth } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const accessToken = localStorage.getItem("accessToken");
      
      if (accessToken && !isAuth) {
        try {
          await dispatch(getProfileUser()).unwrap();
          navigate("/dashboard");
        } catch (error) {
          return;
        }
      } else if (isAuth) {
        navigate("/dashboard");
      }
    };

    checkAuthStatus();
  }, [dispatch, isAuth, navigate]);

  // if (checking || loading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
  //     </div>
  //   );
  // }

  return <>{children}</>;
};