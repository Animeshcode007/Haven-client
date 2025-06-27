import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "YOUR_UPLOAD_PRESET";

const cloudinaryAxiosInstance = axios.create();
delete cloudinaryAxiosInstance.defaults.headers.common["Authorization"];

const EditProfilePage = () => {
  const { user, setUser, setLoading: setAuthLoading } = useAuth(); // setUser to update AuthContext
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    email: "",
    bio: "",
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [initialImageUrl, setInitialImageUrl] = useState(""); // To track if image changed

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState("");
  const [initialCoverPhotoUrl, setInitialCoverPhotoUrl] = useState("");
  const coverFileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        gender: user.gender || "",
        email: user.email || "",
        bio: user.bio || "",
      });
      setPreviewImage(user.profilePictureUrl || "");
      setInitialImageUrl(user.profilePictureUrl || "");
      setCoverPhotoPreview(user.coverPhotoUrl || "");
      setInitialCoverPhotoUrl(user.coverPhotoUrl || "");
    } else {
      navigate("/signin"); // Should be protected by ProtectedRoute anyway
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Cover image is too large (max 8MB).");
        return;
      }
      setCoverPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeCoverPhotoPreview = () => {
    setCoverPhotoFile(null);
    setCoverPhotoPreview(initialCoverPhotoUrl);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("Image is too large (max 5MB).");
        setProfilePictureFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const removeImagePreview = () => {
    setProfilePictureFile(null);
    setPreviewImage(initialImageUrl);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();
    let isCurrentlySubmitting = true;
    setIsSubmittingText(isCurrentlySubmitting);
    setIsUploadingImage(
      isCurrentlySubmitting && (profilePictureFile || coverPhotoFile)
    );

    setAuthLoading(true);

    let finalProfilePicUrl = user.profilePictureUrl;
    let finalCoverPhotoUrl = user.coverPhotoUrl;

    try {
      if (profilePictureFile) {
        const cloudProfilePicFormData = new FormData();
        cloudProfilePicFormData.append("file", profilePictureFile);
        cloudProfilePicFormData.append(
          "upload_preset",
          CLOUDINARY_UPLOAD_PRESET
        );
        const cloudinaryProfileRes = await cloudinaryAxiosInstance.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          cloudProfilePicFormData
        );
        finalProfilePicUrl = cloudinaryProfileRes.data.secure_url;
      }

      if (coverPhotoFile) {
        const cloudCoverFormData = new FormData();
        cloudCoverFormData.append("file", coverPhotoFile);
        cloudCoverFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        console.log("Uploading cover photo to Cloudinary...");
        const cloudinaryCoverRes = await cloudinaryAxiosInstance.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          cloudCoverFormData
        );
        finalCoverPhotoUrl = cloudinaryCoverRes.data.secure_url;
      }
      const { data: backendTextUpdateResponse } = await axios.put(
        "/api/users/profile",
        formData
      );
      let userAfterAllServerUpdates = { ...backendTextUpdateResponse };
      if (finalProfilePicUrl !== user.profilePictureUrl) {
        const { data: backendPicUpdateResponse } = await axios.put(
          "/api/users/profile/picture",
          { imageUrl: finalProfilePicUrl }
        );
        userAfterAllServerUpdates = {
          ...userAfterAllServerUpdates,
          ...backendPicUpdateResponse,
          profilePictureUrl: finalProfilePicUrl,
        };
      } else {
        userAfterAllServerUpdates.profilePictureUrl = finalProfilePicUrl;
      }

      if (finalCoverPhotoUrl !== user.coverPhotoUrl) {
        const { data: backendCoverUpdateResponse } = await axios.put(
          "/api/users/profile/cover",
          { imageUrl: finalCoverPhotoUrl }
        );
        userAfterAllServerUpdates = {
          ...userAfterAllServerUpdates,
          ...backendCoverUpdateResponse,
          coverPhotoUrl: finalCoverPhotoUrl,
        };
      } else {
        userAfterAllServerUpdates.coverPhotoUrl = finalCoverPhotoUrl;
      }
      const updatedUserForContext = {
        ...user,
        ...userAfterAllServerUpdates,
        profilePictureUrl: finalProfilePicUrl,
        coverPhotoUrl: finalCoverPhotoUrl,
      };
      if (userAfterAllServerUpdates.username) {
        updatedUserForContext.username = userAfterAllServerUpdates.username;
      }

      setUser(updatedUserForContext);
      localStorage.setItem("userInfo", JSON.stringify(updatedUserForContext));

      toast.success("Profile updated successfully!");
      setInitialImageUrl(finalProfilePicUrl);
      setInitialCoverPhotoUrl(finalCoverPhotoUrl);
      setProfilePictureFile(null);
      setCoverPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (coverFileInputRef.current) coverFileInputRef.current.value = "";

      setTimeout(() => {
        navigate(`/profile/${user._id}`);
      }, 1500);
    } catch (err) {
      console.error("Full Profile Update Process Error:", err.response || err);
      const serverErrorMessage = err.response?.data?.message;
      const displayMessage =
        serverErrorMessage ||
        "An error occurred while updating profile. Please try again.";
      toast.error(displayMessage);
    } finally {
      isCurrentlySubmitting = false;
      setIsSubmittingText(isCurrentlySubmitting);
      setIsUploadingImage(false);
      setAuthLoading(false);
    }
  };

  if (!user)
    return (
      <MainLayout>
        <div className="text-center py-10">Loading...</div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 dashboard-bg">
        <div className="max-w-lg w-full space-y-8 p-8 sm:p-10 bg-white shadow-2xl rounded-xl">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-black">
              Edit Your Profile
            </h2>
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
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Cover Photo
              </label>
              {coverPhotoPreview && (
                <div className="mt-1 relative group aspect-w-16 aspect-h-7 block w-full overflow-hidden rounded-lg border border-gray-300">
                  <img
                    src={coverPhotoPreview}
                    alt="Cover preview"
                    className="object-cover w-full h-full"
                  />
                  <button type="button" onClick={removeCoverPhotoPreview}>
                    {" "}
                    Remove{" "}
                  </button>
                </div>
              )}
              <button
                type="button"
                className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => coverFileInputRef.current?.click()}
              >
                {coverPhotoPreview ? "Change Cover" : "Upload Cover"}
              </button>
              <input
                type="file"
                ref={coverFileInputRef}
                onChange={handleCoverFileChange}
                accept="image/*"
                className="sr-only"
              />
            </div>
            <div className="flex flex-col items-center space-y-2">
              <label className="block text-sm font-medium text-gray-700 self-start">
                Profile Picture
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <span className="inline-block h-24 w-24 rounded-full overflow-hidden bg-gray-200 ring-2 ring-offset-2 ring-gray-300">
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
                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Change
                  </button>
                  {previewImage &&
                    (previewImage !== initialImageUrl ||
                      profilePictureFile) && (
                      <button
                        type="button"
                        onClick={removeImagePreview}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove new image
                      </button>
                    )}
                </div>
                <input
                  id="profilePictureFile"
                  name="profilePictureFile"
                  type="file"
                  className="sr-only"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
              {isUploadingImage && (
                <p className="text-xs text-blue-500 mt-1">
                  Uploading new image...
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-md"
              >
                <option value="">Select Gender</option>{" "}
                <option value="Male">Male</option>{" "}
                <option value="Female">Female</option>{" "}
                <option value="Other">Other</option>{" "}
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700"
              >
                Bio (Max 160 chars)
              </label>
              <textarea
                name="bio"
                id="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                maxLength="160"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm resize-none"
              ></textarea>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmittingText || isUploadingImage}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:opacity-60"
              >
                {isSubmittingText || isUploadingImage
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default EditProfilePage;
