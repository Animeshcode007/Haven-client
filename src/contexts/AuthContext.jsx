import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const parsedInfo = JSON.parse(storedUserInfo);
      setUser(parsedInfo);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${parsedInfo.token}`;
    }
    setLoading(false);
  }, []);

  const signinUser = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/signin", {
        username,
        password,
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error; 
    }
  };

  const signupUser = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/signup", {
        username,
        password,
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logoutUser = () => {
    setLoading(true);
    localStorage.removeItem("userInfo");
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    setLoading(false);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
        signinUser,
        signupUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
