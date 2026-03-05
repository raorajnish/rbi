// src/auth/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Eye, EyeOff, AlertCircle, Building2, UserCheck } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    organizationType: "",
    cinNumber: "",
    gstin: "",
    headOfficeLocation: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Frontend validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      await api.post("users/register/", {
        username: form.username,
        email: form.email,
        password: form.password,
        company_name: form.companyName,
        organization_type: form.organizationType,
        cin_number: form.cinNumber,
        gstin: form.gstin,
        head_office_location: form.headOfficeLocation,
      });

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Registration failed. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-blue-50 px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-t-2xl p-8 text-center shadow-lg">
          <Building2 size={40} className="mx-auto mb-3" />
          <h1 className="text-4xl font-bold">RBI Pilot</h1>
          <p className="text-blue-100 mt-2">Register Your Organization</p>
        </div>

        {/* Register Card */}
        <div className="bg-white p-8 rounded-b-2xl shadow-lg border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <UserCheck
                size={20}
                className="text-green-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-8">
            {/* Organization Section */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="font-semibold text-lg text-gray-900 mb-6 flex items-center gap-2">
                <Building2 size={20} className="text-primary" />
                Organization Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Your Company Name"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Organization Type *
                  </label>
                  <select
                    value={form.organizationType}
                    onChange={(e) =>
                      setForm({ ...form, organizationType: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="NBFC">NBFC</option>
                    <option value="Payment Aggregator">
                      Payment Aggregator
                    </option>
                    <option value="Commercial Bank">Commercial Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    CIN Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., U65990KA2020PTC123456"
                    value={form.cinNumber}
                    onChange={(e) =>
                      setForm({ ...form, cinNumber: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    GSTIN *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 29AABCF1234H1Z5"
                    value={form.gstin}
                    onChange={(e) =>
                      setForm({ ...form, gstin: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Head Office Location *
                  </label>
                  <input
                    type="text"
                    placeholder="City, State, Country"
                    value={form.headOfficeLocation}
                    onChange={(e) =>
                      setForm({ ...form, headOfficeLocation: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            </div>

            {/* User Credentials Section */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <UserCheck size={18} />
                User Account
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="your@company.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Register Organization"}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-sm text-text-muted text-center mt-6">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
