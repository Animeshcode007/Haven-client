import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../layouts/MainLayout";
import PostCard from "../components/post/PostCard";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import {
  UserPlusIcon,
  UserMinusIcon,
  CheckIcon,
  ClockIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/solid";

const POSTS_PER_PAGE_PROFILE = 5;

const UserProfilePage = () => {
  const { userId: profileUserId } = useParams();
  const { user: currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");
  const [friendshipActionLoading, setFriendshipActionLoading] = useState(false);

  useEffect(() => {
    if (!profileUserId) return;
    setLoadingProfile(true);
    setError("");
    axios
      .get(`/api/users/${profileUserId}`)
      .then((response) => {
        setProfileUser(response.data);
        if (currentUser && currentUser._id === response.data._id) {
        }
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err);
        toast.error(err.response?.data?.message || "Could not load profile.");
        setProfileUser(null);
      })
      .finally(() => setLoadingProfile(false));
  }, [profileUserId, currentUser]);

  const fetchUserPosts = useCallback(
    async (pageToFetch) => {
      if (!profileUserId) return;
      if (pageToFetch === 1) setLoadingPosts(true);
      else setLoadingPosts(false);

      try {
        const { data } = await axios.get(
          `/api/users/${profileUserId}/posts?page=${pageToFetch}&limit=${POSTS_PER_PAGE_PROFILE}`
        );
        setPosts((prev) =>
          pageToFetch === 1 ? data.posts : [...prev, ...data.posts]
        );
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setHasMorePosts(data.currentPage < data.totalPages);
      } catch (err) {
        console.error("Error fetching user posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    },
    [profileUserId]
  );

  useEffect(() => {
    if (profileUser) {
      fetchUserPosts(1);
    }
  }, [profileUser, fetchUserPosts]);

  const loadMoreUserPosts = useCallback(() => {
    if (hasMorePosts && !loadingPosts) {
      fetchUserPosts(currentPage + 1);
    }
  }, [hasMorePosts, loadingPosts, currentPage, fetchUserPosts]);

  const { lastPostElementRef } = useInfiniteScroll(
    loadMoreUserPosts,
    hasMorePosts,
    loadingPosts
  );

  const handleFriendAction = async () => {
    if (!profileUser || friendshipActionLoading) return;
    setFriendshipActionLoading(true);
    try {
      let newStatus = profileUser.friendshipStatus;
      if (profileUser.friendshipStatus === "not_friends") {
        await axios.post(`/api/friends/request/${profileUser._id}`);
        newStatus = "request_sent";
      } else if (profileUser.friendshipStatus === "request_sent") {
        await axios.delete(`/api/friends/remove/${profileUser._id}`);
        newStatus = "not_friends";
      } else if (profileUser.friendshipStatus === "request_received") {
        alert("Please respond from your Friend Requests page.");
      } else if (profileUser.friendshipStatus === "friends") {
        if (
          window.confirm(
            `Are you sure you want to unfriend ${
              profileUser.fullName || profileUser.username
            }?`
          )
        ) {
          await axios.delete(`/api/friends/remove/${profileUser._id}`);
          newStatus = "not_friends";
        }
      }
      setProfileUser((prev) => ({ ...prev, friendshipStatus: newStatus }));
    } catch (err) {
      console.error("Friend action error:", err);
      alert(err.response?.data?.message || "Action failed.");
    } finally {
      setFriendshipActionLoading(false);
    }
  };
  const handlePostUpdated = (updatedPost) =>
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  const handlePostDeleted = (deletedPostId) =>
    setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));

  if (loadingProfile)
    return (
      <MainLayout>
        <div className="text-center py-10">Loading profile...</div>
      </MainLayout>
    );
  if (error && !profileUser)
    return (
      <MainLayout>
        <div className="text-center py-10 text-red-500">{error}</div>
      </MainLayout>
    );
  if (!profileUser)
    return (
      <MainLayout>
        <div className="text-center py-10">User not found.</div>
      </MainLayout>
    );

  const isOwnProfile = currentUser?._id === profileUser._id;

  const FriendActionButton = () => {
    if (isOwnProfile) return null;
    switch (profileUser.friendshipStatus) {
      case "not_friends":
        return (
          <button
            onClick={handleFriendAction}
            disabled={
              friendshipActionLoading || !currentUser?.isProfileComplete
            }
            className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 flex items-center disabled:opacity-50"
          >
            {" "}
            <UserPlusIcon className="h-4 w-4 mr-2" /> Add Friend{" "}
          </button>
        );
      case "request_sent":
        return (
          <button
            onClick={handleFriendAction}
            disabled={friendshipActionLoading}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 flex items-center"
          >
            {" "}
            <ClockIcon className="h-4 w-4 mr-2" /> Request Sent{" "}
          </button>
        );
      case "request_received":
        return (
          <Link
            to="/friend-requests"
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600"
          >
            {" "}
            Respond to Request{" "}
          </Link>
        );
      case "friends":
        return (
          <div className="flex space-x-2">
            <Link
              to={`/chat/t/${profileUser._id}`}
              className="bg-gray-700 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-600 flex items-center"
            >
              {" "}
              <EnvelopeIcon className="h-4 w-4 mr-2" /> Message{" "}
            </Link>
            <button
              onClick={handleFriendAction}
              disabled={friendshipActionLoading}
              className="bg-red-100 text-red-600 px-4 py-2 rounded-md text-sm hover:bg-red-200 flex items-center"
            >
              {" "}
              <UserMinusIcon className="h-4 w-4 mr-2" /> Unfriend{" "}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const defaultProfilePic =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' clip-rule='evenodd' /%3E%3C/svg%3E";
  const defaultCoverPic =
    "https://images.unsplash.com/photo-1500964757637-c85e8a162699?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1500&q=80";

  return (
    <MainLayout>
      <div className="profile-page-with-full-bg">
        {" "}
        <div
          className="h-48 md:h-64 bg-gray-300 bg-cover bg-center"
          style={{
            backgroundImage: profileUser.coverPhotoUrl
              ? `url(${profileUser.coverPhotoUrl})`
              : `url(${defaultCoverPic})`,
          }}
        ></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
            <div className="relative shrink-0">
              <img
                className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white object-cover"
                src={profileUser.profilePictureUrl || defaultProfilePic}
                alt={profileUser.username}
              />
            </div>
            <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
              <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-black truncate">
                  {profileUser.fullName || profileUser.username}
                </h1>
                <p className="text-sm text-gray-500 truncate">
                  @{profileUser.username}
                </p>
              </div>
              <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                <FriendActionButton />
                {isOwnProfile && (
                  <Link
                    to="/profile/edit"
                    className="bg-white text-gray-700 font-semibold px-4 py-2 rounded-md text-sm border border-gray-300 hover:bg-gray-50"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden sm:block md:hidden mt-6 min-w-0 flex-1">
            {" "}
            <h1 className="text-2xl font-bold text-black truncate">
              {profileUser.fullName || profileUser.username}
            </h1>
            <p className="text-sm text-gray-500 truncate">
              @{profileUser.username}
            </p>
          </div>
        </div>
        {profileUser.bio && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 py-4 border-t border-b border-gray-400">
            <p className="text-sm text-black font-semibold text-center">
              {profileUser.bio}
            </p>
          </div>
        )}
        {!profileUser.bio && isOwnProfile && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 py-4 border-t border-b border-gray-200 text-center">
            <Link
              to="/profile/edit"
              className="text-sm text-blue-600 hover:underline"
            >
              Add a bio
            </Link>
          </div>
        )}
        <div className="mt-8 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-black mb-4">Posts</h2>
          {loadingPosts && posts.length === 0 ? (
            <p>Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-500">
              {isOwnProfile ? "You haven't" : `${profileUser.username} hasn't`}{" "}
              posted anything yet.
            </p>
          ) : (
            <div className="space-y-6">
              {posts.map((post, index) => {
                const keyForPostCard = post._id;
                const postCardProps = {
                  post,
                  onPostUpdate: handlePostUpdated,
                  onPostDelete: handlePostDeleted,
                };
                if (posts.length === index + 1 && hasMorePosts) {
                  return (
                    <div ref={lastPostElementRef}>
                      <PostCard key={keyForPostCard} {...postCardProps} />
                    </div>
                  );
                }
                return <PostCard key={keyForPostCard} {...postCardProps} />;
              })}
            </div>
          )}
          {loadingPosts && posts.length > 0 && (
            <p className="text-center py-4 text-gray-500">
              Loading more posts...
            </p>
          )}
          {!loadingPosts && !hasMorePosts && posts.length > 0 && (
            <p className="text-center py-4 text-gray-500">
              No more posts to show.
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfilePage;
