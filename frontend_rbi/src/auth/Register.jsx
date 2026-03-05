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
    servicesProvided: [],
    complianceAreas: [],
    dataStorageLocation: [],
    kycMethod: [],
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
        services_provided: form.servicesProvided.join(", "),
        compliance_areas: form.complianceAreas.join(", "),
        tech_setup: `Storage: ${form.dataStorageLocation.join(", ")}, KYC: ${form.kycMethod.join(", ")}`,
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
        <div className="bg-white rounded-t-2xl p-8 text-center shadow-sm border-b border-gray-100">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
            <Building2 size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">RBI Pilot</h1>
          <p className="text-gray-500 mt-1">Register Your Organization Profile</p>
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

            {/* Regulatory Scope Section */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="font-semibold text-lg text-gray-900 mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-primary" />
                Regulatory Scope
              </h3>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-text-primary">
                  What services do you provide? (Select all that apply) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    "Lending",
                    "Digital Payments",
                    "Wallet Services",
                    "Merchant Payments",
                    "Cross Border Payments",
                  ].map((service) => (
                    <label
                      key={service}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        form.servicesProvided.includes(service)
                          ? "bg-blue-50 border-primary ring-1 ring-primary"
                          : "bg-surface-alt border-gray-200 hover:border-primary"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        checked={form.servicesProvided.includes(service)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...form.servicesProvided, service]
                            : form.servicesProvided.filter((s) => s !== service);
                          setForm({ ...form, servicesProvided: updated });
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {service}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Compliance Setup Section */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="font-semibold text-lg text-gray-900 mb-6 flex items-center gap-2">
                <UserCheck size={20} className="text-primary" />
                Compliance Setup
              </h3>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-text-primary">
                  Which compliance areas apply? (Select all that apply) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    "KYC",
                    "AML",
                    "Data Localization",
                    "Risk Management",
                    "Lending Transparency",
                  ].map((area) => (
                    <label
                      key={area}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        form.complianceAreas.includes(area)
                          ? "bg-blue-50 border-primary ring-1 ring-primary"
                          : "bg-surface-alt border-gray-200 hover:border-primary"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        checked={form.complianceAreas.includes(area)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...form.complianceAreas, area]
                            : form.complianceAreas.filter((a) => a !== area);
                          setForm({ ...form, complianceAreas: updated });
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {area}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Tech Setup Section */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="font-semibold text-lg text-gray-900 mb-6 flex items-center gap-2">
                <Building2 size={20} className="text-primary" />
                Tech Setup
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Data Storage Location *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["India", "Outside India"].map((loc) => (
                      <label
                        key={loc}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                          form.dataStorageLocation.includes(loc)
                            ? "bg-blue-50 border-primary ring-1 ring-primary"
                            : "bg-surface-alt border-gray-200 hover:border-primary"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          checked={form.dataStorageLocation.includes(loc)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...form.dataStorageLocation, loc]
                              : form.dataStorageLocation.filter((l) => l !== loc);
                            setForm({ ...form, dataStorageLocation: updated });
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {loc}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    KYC Method *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {["Aadhaar eKYC", "Video KYC", "Offline KYC"].map((method) => (
                      <label
                        key={method}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                          form.kycMethod.includes(method)
                            ? "bg-blue-50 border-primary ring-1 ring-primary"
                            : "bg-surface-alt border-gray-200 hover:border-primary"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          checked={form.kycMethod.includes(method)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...form.kycMethod, method]
                              : form.kycMethod.filter((m) => m !== method);
                            setForm({ ...form, kycMethod: updated });
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {method}
                        </span>
                      </label>
                    ))}
                  </div>
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
