import React, { useState, useEffect, Fragment } from "react";
import { Menu, Transition, Popover } from "@headlessui/react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import {
  HeartIcon as HeartOutline,
  ChatBubbleOvalLeftIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import CommentItem from "./CommentItem";

const PollDisplay = ({ post, onPostUpdate }) => {
  const { user: currentUser } = useAuth();
  const [isVoting, setIsVoting] = useState(false);

  const hasVoted = React.useMemo(
    () => post.poll.voters?.includes(currentUser._id),
    [post.poll.voters, currentUser._id]
  );
  const totalVotes = React.useMemo(
    () => post.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0),
    [post.poll.options]
  );

  const handleVote = async (optionId) => {
    if (hasVoted || isVoting || !currentUser?.isProfileComplete) {
      if (!currentUser?.isProfileComplete)
        toast.warn("Please complete your profile to vote.");
      return;
    }
    setIsVoting(true);
    try {
      const { data: updatedPost } = await axios.put(
        `/api/posts/${post._id}/poll/${optionId}/vote`
      );
      onPostUpdate(updatedPost);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit vote.");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="px-4 pb-2 space-y-3 pt-3">
      <h3 className="font-semibold text-black">{post.poll.question}</h3>
      {post.poll.options.map((option) => {
        const voteCount = option.votes?.length || 0;
        const percentage =
          totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const didUserChooseThis = option.votes?.includes(currentUser._id);

        return (
          <div key={option._id}>
            {hasVoted ? (
              <div className="relative border border-gray-200 bg-gray-50 rounded-md p-2.5 text-sm overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gray-300 rounded-md"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                <div className="relative flex justify-between items-center font-medium">
                  <span
                    className={`transition-colors ${
                      didUserChooseThis
                        ? "text-black font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {option.text}
                  </span>
                  <div className="flex items-center">
                    {didUserChooseThis && (
                      <CheckIcon className="h-4 w-4 text-black mr-2 shrink-0" />
                    )}
                    <span className="text-gray-600">{percentage}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleVote(option._id)}
                disabled={isVoting}
                className="w-full text-left border border-gray-300 rounded-md p-2.5 text-sm font-medium text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {option.text}
              </button>
            )}
          </div>
        );
      })}
      <p className="text-xs text-gray-500 pt-1">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
};

const PostCard = ({
  post: initialPost,
  onPostUpdate,
  onPostDelete,
  onOpenEditModal,
}) => {
  const [post, setPost] = useState(initialPost);
  const { user: currentUser } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isOwner = currentUser?._id === post.user?._id;

  const {
    user: postUser,
    content,
    imageUrls,
    likes,
    createdAt,
    postType,
    poll,
  } = post;

  const hasLiked = post.likes.some(
    (like) => like === currentUser?._id || like._id === currentUser?._id
  );
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const handleChildUpdate = (updatedPost) => {
    setPost(updatedPost); 
    if (onPostUpdate) onPostUpdate(updatedPost); 
  };

  const handleDeletePost = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await axios.delete(`/api/posts/${post._id}`);
      if (onPostDelete) onPostDelete(post._id); 
    } catch (error) {
      console.error("Failed to delete post", error);
      alert(error.response?.data?.message || "Could not delete post.");
    }
  };

  const handleEditPost = () => {
    console.log("PostCard: handleEditPost called for post:", post._id);
    if (onOpenEditModal) {
      console.log("PostCard: Calling onOpenEditModal");
      onOpenEditModal(post);
    } else {
      console.warn("PostCard: onOpenEditModal prop is undefined!");
    }
  };

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const fetchComments = async () => {
    if (!post._id || loadingComments) return;
    setLoadingComments(true);
    try {
      const { data } = await axios.get(`/api/posts/${post._id}/comments`);
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const newShowState = !showComments;
    setShowComments(newShowState);
    if (newShowState && comments.length === 0) {
      fetchComments();
    }
  };

  const handleLike = async () => {
    if (!currentUser || !currentUser.isProfileComplete || isLiking) {
      if (!currentUser?.isProfileComplete) {
        alert("Please complete your profile to like posts.");
      }
      return;
    }
    setIsLiking(true);
    const originalPost = { ...post }; 

    const newLikesOptimistic = hasLiked 
      ? post.likes.filter(
          (likeId) => (likeId._id || likeId) !== currentUser._id
        ) 
      : [...post.likes, currentUser._id]; 

    setPost((prevPost) => ({ ...prevPost, likes: newLikesOptimistic }));

    if (!hasLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 600); 
    }

    try {
      const { data: updatedPostFromServer } = await axios.put(
        `/api/posts/${post._id}/like`
      );
      console.log(
        "PostCard: Received updated post after like:",
        updatedPostFromServer
      );
      handleChildUpdate(updatedPostFromServer);
    } catch (error) {
      console.error("Failed to like/unlike post", error);
      setPost(originalPost);
      alert(error.response?.data?.message || "Could not update like status.");
    } finally {
      setIsLiking(false);
    }
  };
  const handleCommentUpdatedInList = (updatedComment) => {
    setComments((prevComments) =>
      prevComments.map((c) =>
        c._id === updatedComment._id ? updatedComment : c
      )
    );
  };
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser?.isProfileComplete) {
      if (!currentUser?.isProfileComplete)
        alert("Please complete your profile to comment.");
      return;
    }
    setIsSubmittingComment(true);
    try {
      const { data: addedComment } = await axios.post(
        `/api/posts/${post._id}/comments`,
        {
          text: newCommentText,
        }
      );
      setComments((prevComments) => [...prevComments, addedComment]);
      setNewCommentText("");
      const updatedPostForCount = {
        ...post,
        comments: [...post.comments, addedComment._id],
      };
      handleChildUpdate(updatedPostForCount);
    } catch (error) {
      console.error("Failed to add comment", error);
      alert(error.response?.data?.message || "Could not add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const defaultProfilePic =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' class='w-6 h-6'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' clip-rule='evenodd' /%3E%3C/svg%3E";

  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  return (
    <div className="bg-white border border-gray-400 rounded-lg shadow-sm relative overflow-hidden">
      {showLikeAnimation && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-10"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: 0.6, times: [0, 0.5, 1] }}
          style={{ pointerEvents: "none" }}
        >
          <HeartSolid className="w-24 h-24 text-red-500" />
        </motion.div>
      )}
      <div className="flex items-center p-4">
        <Link to={`/profile/${postUser._id}`}>
          <img
            className="h-10 w-10 rounded-full object-cover mr-3"
            src={postUser?.profilePictureUrl || defaultProfilePic}
            alt={postUser?.username || "User"}
          />
        </Link>
        <div>
          <Link to={`/profile/${postUser._id}`}>
            <p className="font-semibold text-black text-sm">
              {postUser?.fullName || postUser?.username}
            </p>
          </Link>
          <p className="text-xs text-gray-500">{timeSince(createdAt)}</p>
        </div>

        {isOwner && (
          <Menu as="div" className="ml-auto relative">
            <Menu.Button className="p-1 text-gray-500 hover:text-black rounded-full hover:bg-gray-100 focus:outline-none">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleEditPost}
                        className={`${
                          active ? "bg-gray-100 text-black" : "text-gray-700"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <PencilIcon
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                        Edit Post
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDeletePost}
                        className={`${
                          active
                            ? "bg-red-500 text-white"
                            : "text-red-500 hover:text-red-700"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <TrashIcon
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                        Delete Post
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
      <div className="px-4 pb-2">
        <p className="text-black text-sm whitespace-pre-wrap">{content}</p>
      </div>

      {imageUrls && imageUrls.length > 0 && (
        <div className="my-2 bg-black">
          <img
            src={imageUrls[0]}
            alt="Post image"
            className="w-full object-contain max-h-[60vh] md:max-h-[70vh]"
          />
        </div>
      )}
      {postType === "poll" && poll && (
        <PollDisplay post={post} onPostUpdate={handleChildUpdate} />
      )}
      <div className="flex justify-between items-center px-4 py-2 border-t border-gray-200">
        <div className="flex space-x-4">
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`flex items-center group focus:outline-none ${
                    hasLiked
                      ? "text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  }`}
                  onClick={handleLike}
                  disabled={isLiking}
                  title={
                    likes?.length > 0
                      ? `Liked by ${likes.length} ${
                          likes.length === 1 ? "person" : "people"
                        }`
                      : "Like"
                  }
                >
                  {hasLiked ? (
                    <HeartSolid className="h-6 w-6 mr-1 ..." />
                  ) : (
                    <HeartOutline className="h-6 w-6 mr-1 ..." />
                  )}
                  <span className="text-sm">{likes?.length || 0}</span>
                </Popover.Button>
                {likes && likes.length > 0 && (
                  <Transition
                    as={Fragment}
                    show={open}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute z-20 w-auto min-w-[160px] max-w-xs max-h-60 overflow-y-auto mt-2 transform -translate-x-1/2 left-[calc(50%+theme(space.1))] p-2 bg-white border border-gray-300 rounded-md shadow-xl">
                      {" "}
                      <div className="text-xs font-semibold p-1.5 border-b border-gray-200 mb-1 text-black">
                        {" "}
                        Liked by
                      </div>
                      {likes && likes.length > 0 ? (
                        likes.map((likeUser) => (
                          <Link
                            key={likeUser._id}
                            to={`/profile/${likeUser._id}`}
                            className="block p-1.5 hover:bg-gray-100 rounded text-sm"
                          >
                            <div className="flex items-center space-x-2">
                              <img
                                src={
                                  likeUser.profilePictureUrl ||
                                  defaultProfilePic
                                }
                                alt={likeUser.username}
                                className="h-7 w-7 rounded-full object-cover border border-gray-200"
                              />
                              <span className="text-gray-800 truncate">
                                {likeUser.fullName || likeUser.username}
                              </span>{" "}
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="p-1.5 text-xs text-gray-500">
                          No likes yet.
                        </p>
                      )}
                    </Popover.Panel>
                  </Transition>
                )}
              </>
            )}
          </Popover>
          <button
            onClick={toggleComments}
            className="flex items-center text-gray-600 hover:text-blue-500 focus:outline-none"
          >
            <ChatBubbleOvalLeftIcon className="h-6 w-6 mr-1" />
            <span className="text-sm">{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>
      {currentUser?.isProfileComplete && (
        <div className="px-4 py-3 border-t border-gray-200">
          <form
            onSubmit={handleAddComment}
            className="flex items-center space-x-2"
          >
            <img
              className="h-8 w-8 rounded-full object-cover"
              src={currentUser?.profilePictureUrl || defaultProfilePic}
              alt={currentUser?.username}
            />
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 p-2 border border-gray-300 rounded-full text-sm focus:ring-black focus:border-black"
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !newCommentText.trim()}
              className="p-2 rounded-full text-black hover:bg-gray-100 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {showComments && (
        <div className="px-4 py-2 border-t border-gray-200 max-h-60 overflow-y-auto">
          {loadingComments ? (
            <p className="text-xs text-gray-500">Loading comments...</p>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                onCommentUpdate={handleCommentUpdatedInList}
              />
            ))
          ) : (
            <p className="text-xs text-gray-500">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
