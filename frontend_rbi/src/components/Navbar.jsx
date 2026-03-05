import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { LogOut, User, Moon, Sun } from "lucide-react";

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [themeMode, setThemeMode] = useState(
    localStorage.getItem("theme-mode") || "system",
  );

  useEffect(() => {
    const theme = themeMode === "system" ? getSystemTheme() : themeMode;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme-mode", themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-surface shadow-md px-4 md:px-6 py-4 border-b border-border">
      <div className="flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-2"
        >
          🛡️ RBI Pilot
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          {/* If logged in */}
          {user ? (
            <>
              <span className="text-text-secondary text-sm md:text-base hidden sm:block">
                {user.username}
              </span>

              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-surface-alt transition"
              >
                <User size={18} />
                <span className="hidden sm:inline">Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 border border-danger rounded-lg text-danger text-sm hover:bg-danger hover:bg-opacity-10 transition"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-sm hover:text-primary transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 transition"
              >
                Register
              </Link>
            </>
          )}

          <button
            onClick={toggleTheme}
            className="flex items-center px-3 py-2 border border-border rounded-lg hover:bg-surface-alt transition"
          >
            {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
