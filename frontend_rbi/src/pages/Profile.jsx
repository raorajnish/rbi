import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import { Save, Edit2, X } from "lucide-react";

export default function Profile() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Fetch profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response = await api.get("users/profile/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(response.data);
        setFormData(response.data);
        setLoadingProfile(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err?.response?.data?.detail || "Failed to load profile");
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = async () => {
    try {
      setError("");
      setSuccess("");

      const token = localStorage.getItem("access");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const updatePayload = {
        company_name: formData.company_name,
        organization_type: formData.organization_type,
        cin_number: formData.cin_number,
        gstin: formData.gstin,
        head_office_location: formData.head_office_location,
      };

      const response = await api.put("users/profile/", updatePayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(response.data.user);
      setFormData(response.data.user);
      setIsEditing(false);
      setSuccess("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err?.response?.data?.detail || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setError("");
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-text-muted">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[80vh] bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">
            Organization Profile
          </h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger bg-opacity-10 border border-danger rounded-lg text-danger">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-success bg-opacity-10 border border-success rounded-lg text-success">
            {success}
          </div>
        )}

        {/* Profile Card */}
        {profile && (
          <div className="bg-surface rounded-lg shadow-lg p-8 border border-border">
            {/* User Info Section */}
            <div className="mb-8 pb-8 border-b border-border">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                User Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-muted">Username</p>
                  <p className="text-lg font-medium text-text-primary">
                    {profile.username}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Email</p>
                  <p className="text-lg font-medium text-text-primary">
                    {profile.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Role</p>
                  <p className="text-lg font-medium text-text-primary">
                    {profile.role}
                  </p>
                </div>
                {profile.created_at && (
                  <div>
                    <p className="text-sm text-text-muted">Member Since</p>
                    <p className="text-lg font-medium text-text-primary">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Info Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Organization Details
              </h2>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border rounded-md bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Organization Type */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Organization Type
                    </label>
                    <select
                      name="organization_type"
                      value={formData.organization_type || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border rounded-md bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Organization Type</option>
                      <option value="NBFC">NBFC</option>
                      <option value="Payment Aggregator">
                        Payment Aggregator
                      </option>
                      <option value="Commercial Bank">Commercial Bank</option>
                    </select>
                  </div>

                  {/* CIN Number */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      CIN Number
                    </label>
                    <input
                      type="text"
                      name="cin_number"
                      value={formData.cin_number || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border rounded-md bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* GSTIN */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border rounded-md bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Head Office Location */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Head Office Location
                    </label>
                    <input
                      type="text"
                      name="head_office_location"
                      value={formData.head_office_location || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border rounded-md bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-2 bg-success text-white rounded-lg hover:opacity-90 transition"
                    >
                      <Save size={18} />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-6 py-2 bg-text-muted text-white rounded-lg hover:opacity-90 transition"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-muted">Company Name</p>
                    <p className="text-lg font-medium text-text-primary">
                      {profile.company_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Organization Type</p>
                    <p className="text-lg font-medium text-text-primary">
                      {profile.organization_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">CIN Number</p>
                    <p className="text-lg font-medium text-text-primary">
                      {profile.cin_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">GSTIN</p>
                    <p className="text-lg font-medium text-text-primary">
                      {profile.gstin}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-text-muted">
                      Head Office Location
                    </p>
                    <p className="text-lg font-medium text-text-primary">
                      {profile.head_office_location}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
