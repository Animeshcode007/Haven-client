import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  PhotoIcon,
  TrashIcon,
  ListBulletIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const cloudinaryAxiosInstance = axios.create();
delete cloudinaryAxiosInstance.defaults.headers.common["Authorization"];

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([
    { id: 1, text: "" },
    { id: 2, text: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setContent("");
        setImageFile(null);
        setImagePreview("");
        setShowPollCreator(false);
        setPollQuestion("");
        setPollOptions([
          { id: 1, text: "" },
          { id: 2, text: "" },
        ]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsSubmitting(false);
      }, 300);
    }
  }, [isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handlePollOptionChange = (id, value) =>
    setPollOptions((opts) =>
      opts.map((o) => (o.id === id ? { ...o, text: value } : o))
    );
  const addPollOption = () =>
    setPollOptions((opts) =>
      opts.length < 4 ? [...opts, { id: Date.now(), text: "" }] : opts
    );
  const removePollOption = (id) =>
    setPollOptions((opts) =>
      opts.length > 2 ? opts.filter((o) => o.id !== id) : opts
    );
  const togglePollCreator = () => setShowPollCreator((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();
    if (!user?.isProfileComplete) {
      toast.error("Please complete your profile to post.");
      return;
    }

    let finalImageUrls = [];
    let finalPollData = null;
    if (showPollCreator) {
      if (!pollQuestion.trim()) {
        toast.error("Poll question is required.");
        return;
      }
      const validOptions = pollOptions.filter((opt) => opt.text.trim() !== "");
      if (validOptions.length < 2) {
        toast.error("A poll needs at least two valid options.");
        return;
      }
      finalPollData = {
        question: pollQuestion.trim(),
        options: validOptions.map((opt) => ({ text: opt.text.trim() })),
      };
    }
    if (!content.trim() && !imageFile && !finalPollData) {
      toast.error("Please add content, an image, or a valid poll.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (imageFile) {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
          throw new Error("Image upload service is not configured.");
        }
        const cloudFormData = new FormData();
        cloudFormData.append("file", imageFile);
        cloudFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const cloudinaryRes = await cloudinaryAxiosInstance.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          cloudFormData
        );
        finalImageUrls.push(cloudinaryRes.data.secure_url);
      }

      const payload = {
        content: content.trim(),
        imageUrls: finalImageUrls,
        poll: finalPollData,
      };

      const { data: newPost } = await axios.post("/api/posts", payload);
      onPostCreated(newPost);
      toast.success("Post created successfully!");
      onClose();
    } catch (err) {
      console.error("Create post process error:", err);
      toast.error(err.response?.data?.message || "Failed to create post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPostButtonDisabled =
    isSubmitting || (!content.trim() && !imageFile && !showPollCreator);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60] overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-black p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-bold text-black mb-4 text-center border-b pb-3">
            Create Post
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start space-x-3">
              <img
                src={
                  user?.profilePictureUrl ||
                  `https://ui-avatars.com/api/?name=${
                    user?.username?.charAt(0) || "U"
                  }&background=random`
                }
                alt={user?.username}
                className="h-10 w-10 rounded-full object-cover"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${
                  user?.username || "User"
                }?`}
                rows="3"
                className="w-full p-2 border-none focus:ring-0 resize-none text-base placeholder-gray-500"
                maxLength="1000"
              />
            </div>

            {imagePreview && (
              <div className="relative group rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Post preview"
                  className="w-full max-h-80 object-contain"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-1 rounded-full hover:bg-opacity-80 transition-opacity"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {showPollCreator && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 border-t border-gray-200 pt-4"
              >
                <input
                  type="text"
                  placeholder="Poll Question"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm"
                />
                <div className="space-y-2">
                  {pollOptions.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) =>
                          handlePollOptionChange(option.id, e.target.value)
                        }
                        className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePollOption(option.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={addPollOption}
                    className="w-full flex items-center justify-center text-sm p-2 border-2 border-dashed rounded-md text-gray-500 hover:border-black hover:text-black transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" /> Add Option
                  </button>
                )}
              </motion.div>
            )}

            <div className="flex justify-between items-center border rounded-lg p-2 mt-4">
              <span className="text-sm font-medium text-gray-700">
                Add to your post
              </span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  title="Add Photo"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-green-500 rounded-full hover:bg-green-50 transition-colors"
                >
                  <PhotoIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  title={showPollCreator ? "Remove Poll" : "Add Poll"}
                  onClick={togglePollCreator}
                  className={`p-2 rounded-full hover:bg-blue-50 transition-colors ${
                    showPollCreator
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-500 hover:text-blue-500"
                  }`}
                >
                  <ListBulletIcon className="h-6 w-6" />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPostButtonDisabled}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePostModal;
