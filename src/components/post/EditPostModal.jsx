import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/solid";

const EditPostModal = ({ isOpen, onClose, postToEdit, onPostUpdated }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill the form content when the `postToEdit` prop changes
  useEffect(() => {
    if (postToEdit) {
      setContent(postToEdit.content || "");
    }
  }, [postToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasImage = postToEdit.imageUrls && postToEdit.imageUrls.length > 0;
    if (!hasImage && !content.trim()) {
      toast.error("Post content cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { content: content.trim() };
      const { data: updatedPost } = await axios.put(
        `/api/posts/${postToEdit._id}`,
        payload
      );

      onPostUpdated(updatedPost); // Notify parent component of the update
      toast.success("Post updated successfully!");
      onClose(); // Close the modal
    } catch (err) {
      console.error("EditPostModal: Update post error:", err);
      toast.error(err.response?.data?.message || "Failed to update post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If the modal isn't open or there's no post to edit, render nothing.
  if (!isOpen || !postToEdit) {
    return null;
  }

  // Determine if the save button should be disabled
  const hasImage = postToEdit.imageUrls && postToEdit.imageUrls.length > 0;
  const isSaveDisabled = isSubmitting || (!hasImage && !content.trim());

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[70]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative"
          onClick={(e) => e.stopPropagation()}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-black p-1 rounded-full transition-colors hover:bg-gray-100"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-bold text-black mb-4 text-center border-b pb-3">
            Edit Post
          </h2>
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="5"
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent resize-none text-base"
              maxLength="1000"
              placeholder="Edit your post content..."
              autoFocus
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {content.length}/1000
            </div>

            {/* Display existing image(s) if they exist */}
            {hasImage && (
              <div className="mt-4">
                <img
                  src={postToEdit.imageUrls[0]}
                  alt="Post image (cannot be changed)"
                  className="w-full max-h-60 object-contain rounded-md border border-gray-200"
                />
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Image editing is not yet supported.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaveDisabled}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditPostModal;
