import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import EditPostModal from "../components/post/EditPostModal";
import MainLayout from "../layouts/MainLayout";
import CreatePostModal from "../components/post/CreatePostModal";
import PostCard from "../components/post/PostCard";
import useInfiniteScroll from "../hooks/useInfiniteScroll";

const POSTS_PER_PAGE = 10;

const DashboardPage = () => {
  const { user, setLoading: setAuthLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [loadingInitialPosts, setLoadingInitialPosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  const fetchPosts = useCallback(
    async (pageToFetch) => {
      if (!user) return;
      setError("");
      if (pageToFetch === 1) setLoadingInitialPosts(true);
      else setLoadingMorePosts(true);

      try {
        const { data } = await axios.get(
          `/api/posts?page=${pageToFetch}&limit=${POSTS_PER_PAGE}`
        );
        setPosts((prevPosts) =>
          pageToFetch === 1 ? data.posts : [...prevPosts, ...data.posts]
        );
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setHasMorePosts(data.currentPage < data.totalPages);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch posts.";
        setError(errorMessage);
        console.error("Fetch posts error:", err);
      } finally {
        if (pageToFetch === 1) setLoadingInitialPosts(false);
        else setLoadingMorePosts(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const loadMorePostsCallback = useCallback(() => {
    if (hasMorePosts && !loadingMorePosts) {
      fetchPosts(currentPage + 1);
    }
  }, [hasMorePosts, loadingMorePosts, currentPage, fetchPosts]);

  const { lastPostElementRef } = useInfiniteScroll(
    loadMorePostsCallback,
    hasMorePosts,
    loadingMorePosts
  );

  const handlePostCreated = (newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
    setIsCreatePostModalOpen(false);
    setCurrentPage(1);
    setHasMorePosts(true);
    setPosts([]);
    fetchPosts(1);
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prevPosts) => prevPosts.filter((p) => p._id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPost) => {
    console.log("DashboardPage: handlePostUpdated received:", updatedPost);
    setPosts((prevPosts) =>
      prevPosts.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
    setIsEditPostModalOpen(false);
    setPostToEdit(null);
  };

  const openEditModalHandler = (post) => {
    setPostToEdit(post);
    setIsEditPostModalOpen(true);
  };
  const closeEditModalHandler = () => {
    setIsEditPostModalOpen(false);
    setPostToEdit(null);
  };
  useEffect(() => {
    console.log("DashboardPage: postToEdit state:", postToEdit);
    console.log(
      "DashboardPage: isEditPostModalOpen state:",
      isEditPostModalOpen
    );
  }, [postToEdit, isEditPostModalOpen]);

  return (
    <MainLayout onOpenCreatePostModal={() => setIsCreatePostModalOpen(true)}>
      <div className="container mx-auto px-4 py-8 dashboard-bg min-h-[calc(100vh-4rem)]">
        {" "}
        {error && (
          <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>
        )}
        {loadingInitialPosts ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-lg shadow animate-pulse"
              >
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 bg-gray-300 rounded-full mr-3"></div>
                  <div className="w-1/3 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500">No posts yet.</p>
            {user?.isProfileComplete && (
              <p className="text-gray-500 mt-2">
                Be the first to share something!
              </p>
            )}
            {!user?.isProfileComplete && (
              <p className="text-gray-500 mt-2">
                <Link
                  to="/complete-profile"
                  className="text-black hover:underline font-semibold"
                >
                  Complete your profile
                </Link>{" "}
                to start posting.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto">
            {posts.map((post, index) => {
              if (posts.length === index + 1) {
                return (
                  <div ref={lastPostElementRef} key={post._id}>
                    <PostCard
                      post={post}
                      onPostUpdate={handlePostUpdated}
                      onOpenEditModal={openEditModalHandler}
                    />
                  </div>
                );
              } else {
                return (
                  <PostCard
                    key={post._id}
                    post={post}
                    onPostUpdate={handlePostUpdated}
                    onPostDelete={handlePostDeleted}
                    onOpenEditModal={openEditModalHandler}
                  />
                );
              }
            })}
          </div>
        )}
        {loadingMorePosts && (
          <div className="text-center py-6">
            <p className="text-gray-500">Loading more posts...</p>
          </div>
        )}
        {!loadingMorePosts && !hasMorePosts && posts.length > 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500">You've reached the end!</p>
          </div>
        )}
      </div>
      {isEditPostModalOpen &&
        postToEdit &&
        console.log("DashboardPage: Rendering EditPostModal with props:", {
          isEditPostModalOpen,
          postToEdit,
        })}
      {isEditPostModalOpen && postToEdit && (
        <EditPostModal
          isOpen={isEditPostModalOpen}
          onClose={closeEditModalHandler}
          postToEdit={postToEdit}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </MainLayout>
  );
};

export default DashboardPage;
