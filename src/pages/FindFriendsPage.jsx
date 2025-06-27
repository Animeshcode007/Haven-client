import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../layouts/MainLayout";
import {
  UserPlusIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/solid"; 
import { Link } from "react-router-dom";

const UserCard = ({
  userToDisplay,
  currentUserId,
  onFriendRequestSent,
  existingRequests,
  friends,
}) => {
  const [requestStatus, setRequestStatus] = useState("");
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (friends?.some((friend) => friend._id === userToDisplay._id)) {
      setRequestStatus("already_friends");
      return;
    }
    const existingSent = existingRequests?.sent?.find(
      (req) => req.receiver === userToDisplay._id && req.status === "pending"
    );
    const existingReceived = existingRequests?.received?.find(
      (req) => req.sender === userToDisplay._id && req.status === "pending"
    );

    if (existingSent) {
      setRequestStatus("sent");
    } else if (existingReceived) {
      setRequestStatus("received_pending");
    } else {
      setRequestStatus("");
    }
  }, [userToDisplay, currentUserId, existingRequests, friends]);

  const handleSendRequest = async () => {
    if (!currentUser?.isProfileComplete) {
      alert("Please complete your profile to send friend requests.");
      return;
    }
    setRequestStatus("sending");
    try {
      await axios.post(`/api/friends/request/${userToDisplay._id}`);
      setRequestStatus("sent");
      if (onFriendRequestSent) onFriendRequestSent(userToDisplay._id);
    } catch (error) {
      console.error("Send friend request error", error);
      setRequestStatus("error");
      alert(error.response?.data?.message || "Could not send friend request.");
      if (
        error.response?.data?.message.toLowerCase().includes("already sent")
      ) {
        setRequestStatus("sent");
      } else if (
        error.response?.data?.message.toLowerCase().includes("already friends")
      ) {
        setRequestStatus("already_friends");
      }
    }
  };

  const defaultProfilePic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' clip-rule='evenodd' /%3E%3C/svg%3E";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
      <div className="flex items-center">
        <Link to={`/profile/${userToDisplay._id}`}>
          <img
            src={userToDisplay.profilePictureUrl || defaultProfilePic}
            alt={userToDisplay.username}
            className="h-12 w-12 rounded-full object-cover mr-4"
          />
        </Link>
        <div>
          <Link to={`/profile/${userToDisplay._id}`}>
            <p className="font-semibold text-black">
              {userToDisplay.fullName || userToDisplay.username}
            </p>
          </Link>
          <p className="text-sm text-gray-500">@{userToDisplay.username}</p>
        </div>
      </div>
      {requestStatus === "sending" && (
        <ClockIcon className="h-6 w-6 text-yellow-500" />
      )}
      {requestStatus === "sent" && (
        <CheckCircleIcon
          className="h-6 w-6 text-green-500"
          titleAccess="Request Sent"
        />
      )}
      {requestStatus === "received_pending" && (
        <p className="text-xs text-blue-500">Request received</p>
      )}
      {requestStatus === "already_friends" && (
        <p className="text-xs text-gray-500">Friends</p>
      )}
      {requestStatus === "error" && (
        <p className="text-xs text-red-500">Error</p>
      )}
      {!requestStatus && currentUser?._id !== userToDisplay._id && (
        <button
          onClick={handleSendRequest}
          className="bg-black text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-800 flex items-center"
          disabled={!currentUser?.isProfileComplete}
          title={
            !currentUser?.isProfileComplete
              ? "Complete profile to add friends"
              : "Send Friend Request"
          }
        >
          <UserPlusIcon className="h-4 w-4 mr-1" /> Add Friend
        </button>
      )}
    </div>
  );
};

const FindFriendsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [userFriends, setUserFriends] = useState([]);
  const [pendingSentRequests, setPendingSentRequests] = useState([]);
  const [pendingReceivedRequests, setPendingReceivedRequests] = useState([]);

  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchSocialStatus = async () => {
      if (!currentUser) return;
      try {
        const [friendsRes, pendingReceivedRes] = await Promise.all([
          axios.get("/api/friends"),
          axios.get("/api/friends/requests/pending"), // these are requests received by current user
        ]);
        setUserFriends(friendsRes.data);
        setPendingReceivedRequests(pendingReceivedRes.data);
      } catch (error) {
        console.error("Error fetching social status:", error);
      }
    };
    fetchSocialStatus();
  }, [currentUser]);

  useEffect(() => {
    if (initialLoad || !searchTerm.trim()) {
      setSearchResults([]);
      if (searchTerm.trim()) setInitialLoad(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/users/search?q=${searchTerm}`);
        setSearchResults(data);
      } catch (error) {
        console.error("Search error", error);
        setSearchResults([]);
      }
      setLoading(false);
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, initialLoad]);

  const handleFriendRequestSent = (receiverId) => {
    setPendingSentRequests((prev) => [
      ...prev,
      { receiver: receiverId, status: "pending" },
    ]);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 dashboard-bg min-h-[calc(100vh-4rem)]">
        <h1 className="text-3xl font-bold text-black mb-6">Find Friends</h1>
        <input
          type="text"
          placeholder="Search by username or name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (initialLoad) setInitialLoad(false);
          }}
          className="w-full p-3 border border-gray-600 rounded-lg shadow-md focus:ring-black focus:border-black mb-6"
        />

        {loading && <p className="text-center text-gray-500">Searching...</p>}

        {!loading &&
          searchTerm &&
          searchResults.length === 0 &&
          !initialLoad && (
            <p className="text-center text-gray-500">
              No users found matching "{searchTerm}".
            </p>
          )}

        <div className="space-y-4">
          {searchResults.map((foundUser) => (
            <UserCard
              key={foundUser._id}
              userToDisplay={foundUser}
              currentUserId={currentUser?._id}
              onFriendRequestSent={handleFriendRequestSent}
              existingRequests={{
                sent: pendingSentRequests,
                received: pendingReceivedRequests,
              }}
              friends={userFriends}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default FindFriendsPage;
