import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import MainLayout from "../../layouts/MainLayout"; 

const UserProfileRedirect = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user && user._id) {
      navigate(`/profile/${user._id}`, { replace: true });
    } else if (!user && !authLoading) {
      navigate("/signin", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || (user && !user._id && user !== null)) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading profile...
        </div>
      </MainLayout>
    );
  }
  return null;
};

export default UserProfileRedirect;
