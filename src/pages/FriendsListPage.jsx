import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../layouts/MainLayout";
import { Link } from "react-router-dom";
import {
  ChatBubbleLeftRightIcon,
  UserMinusIcon,
} from "@heroicons/react/24/solid";

const FriendCard = ({ friend, onUnfriend }) => {
  const [isUnfriending, setIsUnfriending] = useState(false);
  const handleUnfriend = async () => {
    if (
      !window.confirm(
        `Are you sure you want to unfriend ${
          friend.fullName || friend.username
        }?`
      )
    )
      return;
    setIsUnfriending(true);
    try {
      await axios.delete(`/api/friends/remove/${friend._id}`);
      onUnfriend(friend._id);
    } catch (error) {
      console.error("Unfriend error:", error);
      alert(error.response?.data?.message || "Could not unfriend.");
      setIsUnfriending(false);
    }
  };
  const defaultProfilePic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' clip-rule='evenodd' /%3E%3C/svg%3E";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
      <Link to={`/profile/${friend._id}`} className="flex items-center">
        <img
          src={friend.profilePictureUrl || defaultProfilePic}
          alt={friend.username}
          className="h-12 w-12 rounded-full object-cover mr-4"
        />
        <div>
          <p className="font-semibold text-black">
            {friend.fullName || friend.username}
          </p>
          <p className="text-sm text-gray-500">@{friend.username}</p>
        </div>
      </Link>
      <div className="flex space-x-2">
        <Link
          to={`/chat/t/${friend._id}`}
          className="p-2 rounded-full text-blue-600 hover:bg-blue-100"
          title="Chat"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </Link>
        <button
          onClick={handleUnfriend}
          disabled={isUnfriending}
          className="p-2 rounded-full text-red-600 hover:bg-red-100 disabled:opacity-50"
          title="Unfriend"
        >
          <UserMinusIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const FriendsListPage = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data } = await axios.get("/api/friends");
        setFriends(data);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
      setLoading(false);
    };
    fetchFriends();
  }, [user]);

  const handleFriendRemoved = (friendId) => {
    setFriends((prevFriends) => prevFriends.filter((f) => f._id !== friendId));
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 dashboard-bg min-h-[calc(100vh-4rem)]">
        <h1 className="text-3xl font-bold text-black mb-6">My Friends</h1>
        {loading && (
          <p className="text-center text-gray-500">Loading friends...</p>
        )}
        {!loading && friends.length === 0 && (
          <div className="text-center text-gray-500">
            <p>You haven't added any friends yet.</p>
            <Link
              to="/find-friends"
              className="text-black hover:underline font-semibold mt-2 inline-block"
            >
              Find Friends
            </Link>
          </div>
        )}
        <div className="space-y-4 max-w-lg mx-auto">
          {friends.map((friend) => (
            <FriendCard
              key={friend._id}
              friend={friend}
              onUnfriend={handleFriendRemoved}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default FriendsListPage;
