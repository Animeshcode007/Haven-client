import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const CompleteProfilePage = () => {
  const { user, setUser, setLoading: setAuthLoading, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    gender: user?.gender || "",
    email: user?.email || "",
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(
    user?.profilePictureUrl || ""
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.isProfileComplete) {
      navigate("/dashboard");
    }
    setFormData({
      fullName: user.fullName || "",
      gender: user.gender || "",
      email: user.email || "",
    });
    setPreviewImage(user.profilePictureUrl || "");
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    setAuthLoading(true);
    if (!formData.fullName || !formData.gender || !formData.email) {
      toast.error(
        "Full Name, Gender, and Email are required to complete your profile."
      );
      setIsSubmitting(false);
      setAuthLoading(false);
      return;
    }

    try {
      const { data: updatedUserData } = await axios.put(
        "/api/users/profile",
        formData
      );

      if (profilePictureFile) {
        const picFormData = new FormData();
        picFormData.append("profilePicture", profilePictureFile);
        try {
          const { data: picData } = await axios.post(
            "/api/users/profile/picture",
            picFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          updatedUserData.profilePictureUrl = picData.profilePictureUrl;
        } catch (picError) {
          console.error(
            "Profile picture upload error:",
            picError.response ? picError.response.data : picError
          );
        }
      }

      const finalUserInfo = { ...user, ...updatedUserData }; 
      setUser(finalUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(finalUserInfo));

      setSuccess("Profile completed successfully!");
      setTimeout(() => navigate("/dashboard"), 1500); 
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "An error occurred. Please try again.";
      setError(errorMessage);
      console.error(
        "Profile completion error:",
        err.response ? err.response.data : err
      );
    } finally {
      setIsSubmitting(false);
      setAuthLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 dashboard-bg">
      {" "}
      <div className="max-w-lg w-full space-y-8 p-10 bg-white shadow-2xl rounded-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Fill in your details to get the most out of our platform.
          </p>
        </div>

        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
            role="alert"
          >
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4"
            role="alert"
          >
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <label
              htmlFor="profilePicture"
              className="block text-sm font-medium text-gray-700 self-start"
            >
              Profile Picture (Optional)
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-200">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    className="h-full w-full text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 20.993V24H0v-2.993A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </span>
              <label
                htmlFor="profilePictureFile"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                <span>Change</span>
                <input
                  id="profilePictureFile"
                  name="profilePictureFile"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>
            </div>
          </div>
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700"
            >
              Gender *
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-md"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save and Complete Profile"}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex justify-center py-2 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-60"
            >
              Skip for Now
            </button>
          </div>
        </form>
        <button
          onClick={() => {
            logoutUser();
            navigate("/signin");
          }}
          className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
