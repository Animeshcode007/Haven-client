import React, { useState, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../layouts/MainLayout";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

const FriendRequestCard = ({ request, onRespond }) => {
  const { sender } = request;
  const [isResponding, setIsResponding] = useState(false);

  const handleResponse = async (responseStatus) => {
    setIsResponding(true);
    try {
      await axios.put(`/api/friends/requests/${request._id}/respond`, {
        response: responseStatus,
      });
      onRespond(request._id, responseStatus);
    } catch (error) {
      console.error(`Error ${responseStatus}ing request:`, error);
      alert(error.response?.data?.message || "Could not respond to request.");
    }
  };
  const defaultProfilePic =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' clip-rule='evenodd' /%3E%3C/svg%3E";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
      <div className="flex items-center">
        <Link to={`/profile/${sender._id}`}>
          <img
            src={sender.profilePictureUrl || defaultProfilePic}
            alt={sender.username}
            className="h-12 w-12 rounded-full object-cover mr-4"
          />
        </Link>
        <div>
          <Link to={`/profile/${sender._id}`}>
            <p className="font-semibold text-black">
              {sender.fullName || sender.username}
            </p>
          </Link>
          <p className="text-sm text-gray-500">Wants to be your friend.</p>
        </div>
      </div>
      {!isResponding && (
        <div className="flex space-x-2">
          <button
            onClick={() => handleResponse("accepted")}
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
            title="Accept"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleResponse("declined")}
            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            title="Decline"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      {isResponding && <p className="text-sm text-gray-500">Responding...</p>}
    </div>
  );
};

const FriendRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { pendingFriendRequests, clearFriendRequestNotifications } =
    useSocket();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data } = await axios.get("/api/friends/requests/pending");
        setRequests(data);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  useEffect(() => {
    clearFriendRequestNotifications();
    setRequests(pendingFriendRequests);
    setLoading(false);
  }, []);

  const handleRequestResponded = (requestId, status) => {
    setRequests((prevRequests) =>
      prevRequests.filter((req) => req._id !== requestId)
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 dashboard-bg min-h-[calc(100vh-4rem)]">
        <h1 className="text-3xl font-bold text-black mb-6">Friend Requests</h1>
        {loading && (
          <p className="text-center text-gray-500">Loading requests...</p>
        )}
        {!loading && requests.length === 0 && (
          <p className="text-center text-gray-500">
            No pending friend requests.
          </p>
        )}
        <div className="space-y-4 max-w-lg mx-auto">
          {requests.map((req) => (
            <FriendRequestCard
              key={req._id}
              request={req}
              onRespond={handleRequestResponded}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default FriendRequestsPage;
