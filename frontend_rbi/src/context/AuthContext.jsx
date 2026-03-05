import PropTypes from "prop-types";
// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 IMPORTANT

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          username: decoded.username,
          email: decoded.email,
          company_name: decoded.company_name,
          role: decoded.role,
        });
      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem("access");
        setUser(null);
      }
    }

    setLoading(false); // 👈 auth restoration complete
  }, []);

  const login = async (username, password) => {
    const res = await api.post("users/login/", {
      username,
      password,
    });

    const token = res.data.access;
    localStorage.setItem("access", token);

    setUser({
      username: res.data.user.username,
      email: res.data.user.email,
      company_name: res.data.user.company_name,
      role: res.data.user.role,
    });
  };

  const logout = () => {
    localStorage.removeItem("access");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
