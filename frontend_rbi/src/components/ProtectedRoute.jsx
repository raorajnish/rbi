// src/components/ProtectedRoute.jsx

import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // ⏳ Wait until auth is checked
  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  // 🔒 Not authenticated
  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
