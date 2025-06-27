import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import axios from "axios";
import { motion } from "framer-motion";

const CommentItem = ({ comment: initialComment, onCommentUpdate }) => {
  const [comment, setComment] = useState(initialComment);
  const { user: currentUser } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  useEffect(() => {
    setComment(initialComment);
  }, [initialComment]);

  const hasLiked = comment.likes.some(
    (like) => (like._id || like) === currentUser?._id
  );

  const handleLikeComment = async () => {
    if (!currentUser || !currentUser.isProfileComplete || isLiking) {
      if (!currentUser?.isProfileComplete)
        alert("Please complete your profile to like comments.");
      return;
    }
    setIsLiking(true);
    const originalComment = { ...comment };
    const newLikes = hasLiked
      ? comment.likes.filter(
          (likeId) => (likeId._id || likeId) !== currentUser._id
        )
      : [...comment.likes, currentUser._id];
    setComment((prev) => ({ ...prev, likes: newLikes }));

    if (!hasLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 600);
    }

    try {
      const { data: updatedCommentFromServer } = await axios.put(
        `/api/comments/${comment._id}/like`
      );
      setComment(updatedCommentFromServer);
      if (onCommentUpdate) onCommentUpdate(updatedCommentFromServer);
    } catch (error) {
      console.error("Failed to like/unlike comment", error);
      setComment(originalComment);
      alert(
        error.response?.data?.message || "Could not update like on comment."
      );
    } finally {
      setIsLiking(false);
    }
  };

  const { user: commentUser, text, likes, createdAt } = comment;

  const defaultProfilePic =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' class='w-6 h-6'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' clip-rule='evenodd' /%3E%3C/svg%3E";

  const timeSince = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
  };

  return (
    <div className="flex items-start space-x-2 py-2 relative">
      {showLikeAnimation && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 p-2"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.3, 1.2, 0.3] }}
          transition={{ duration: 0.6, times: [0, 0.5, 1] }}
          style={{ pointerEvents: "none" }}
        >
          <HeartSolid className="w-8 h-8 text-red-500" />
        </motion.div>
      )}
      <Link to={`/profile/${commentUser?._id}`}>
        <img
          className="h-8 w-8 rounded-full object-cover"
          src={commentUser?.profilePictureUrl || defaultProfilePic}
          alt={commentUser?.username}
        />
      </Link>
      <div className="flex-1">
        <div className="bg-gray-100 p-2.5 rounded-lg">
          <Link
            to={`/profile/${commentUser?._id}`}
            className="font-semibold text-black text-xs hover:underline"
          >
            {commentUser?.fullName || commentUser?.username}
          </Link>
          <p className="text-black text-sm whitespace-pre-wrap mt-0.5">
            {text}
          </p>
        </div>
        <div className="text-xs text-gray-500 mt-1 pl-1 flex items-center space-x-2">
          <span>{timeSince(createdAt)} ago</span>
          <button
            onClick={handleLikeComment}
            disabled={isLiking || !currentUser?.isProfileComplete}
            className={`font-medium ${
              hasLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            } disabled:opacity-60`}
          >
            {hasLiked ? "Liked" : "Like"}
          </button>
          {likes?.length > 0 && (
            <span className="text-gray-500">
              {likes.length} {likes.length === 1 ? "like" : "likes"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
