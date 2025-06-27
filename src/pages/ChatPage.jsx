import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import MainLayout from "../layouts/MainLayout";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import ChatWindow from "../components/chat/ChatWindow";

const FriendListItem = ({
  friend,
  isOnline,
  onSelectConversation,
  isActiveConvo,
  unreadCount,
  lastMessage,
}) => {
  const defaultProfilePic =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' clip-rule='evenodd' /%3E%3C/svg%3E";
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={`flex items-center justify-between p-3 cursor-pointer border-b border-gray-200 last:border-b-0 ${
        isActiveConvo ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
      onClick={() => onSelectConversation(friend._id)}
    >
      <div className="flex items-center space-x-3 flex-grow  min-w-0">
        <div className="relative">
          <img
            className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
            src={friend.profilePictureUrl || defaultProfilePic}
            alt={friend.fullName || friend.username}
          />
          <span
            className={`absolute bottom-0 right-0 block h-3 w-3 md:h-3.5 md:w-3.5 rounded-full ring-2 ring-white ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
            title={isOnline ? "Online" : "Offline"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-black text-sm truncate ${
              isActiveConvo || unreadCount > 0 ? "font-semibold" : ""
            }`}
          >
            {friend.fullName || friend.username}
          </p>
          {lastMessage?.content ? (
            <p
              className={`text-xs truncate ${
                unreadCount > 0 ? "text-black font-medium" : "text-gray-500"
              }`}
            >
              {lastMessage.sender?._id === friend._id ? "" : "You: "}{" "}
              {truncateText(lastMessage.content, 25)}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">No messages yet</p>
          )}
        </div>
      </div>
      <div className="ml-2 flex flex-col items-end shrink-0">
        {" "}
        {/* shrink-0 to prevent time from shrinking */}
        {unreadCount > 0 && (
          <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {lastMessage?.createdAt && (
          <span className="text-xs text-gray-400">
            {new Date(lastMessage.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
};

const ChatPage = () => {
  const [friends, setFriends] = useState([]);
  const [conversationsList, setConversationsList] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [error, setError] = useState("");
  const { user: currentUser } = useAuth();
  const {
    socket,
    onlineUsers,
    clearUnreadMessagesForConversation,
    unreadMessages,
  } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingSelectedConvo, setLoadingSelectedConvo] = useState(false);
  const { chatWithUserId: paramUserId } = useParams();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const initiateConversationWithUser = useCallback(
    async (otherUserId) => {
      if (!currentUser || !otherUserId) return;
      if (
        selectedConversation?.otherParticipant?._id === otherUserId &&
        selectedConversation?.id
      ) {
        if (socket) socket.emit("joinChat", selectedConversation.id); // Re-join if already selected
        return;
      }
      setLoadingConversation(true);
      setError("");
      try {
        const { data: conversationData } = await axios.post(
          `/api/chat/conversations/${otherUserId}`
        );
        const otherP = conversationData.participants.find(
          (p) => p._id !== currentUser._id.toString()
        );
        setSelectedConversation({
          id: conversationData._id,
          otherParticipant: otherP,
          lastMessage: conversationData.lastMessage,
          updatedAt: conversationData.updatedAt,
        });
        if (socket) socket.emit("joinChat", conversationData._id);
        clearUnreadMessagesForConversation(conversationData._id);
        navigate(`/chat/t/${otherUserId}`, { replace: true }); // Update URL without full page reload
      } catch (err) {
        console.error("Error initiating conversation:", err);
        toast.error("Could not start conversation.");
        setSelectedConversation(null);
      } finally {
        setLoadingConversation(false);
      }
    },
    [
      currentUser,
      socket,
      navigate,
      selectedConversation,
      clearUnreadMessagesForConversation,
    ]
  );

  useEffect(() => {
    let previousConvoId = null;
    if (socket && selectedConversation?.id) {
      if (previousConvoId && previousConvoId !== selectedConversation.id) {
        socket.emit("leaveChat", previousConvoId);
      }
      socket.emit("joinChat", selectedConversation.id);
      previousConvoId = selectedConversation.id;
    }
    return () => {
      if (socket && selectedConversation?.id) {
        socket.emit("leaveChat", selectedConversation.id);
      }
    };
  }, [socket, selectedConversation?.id]);

  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const isSpecificChatRoute =
      pathSegments.length === 4 && pathSegments[2] === "t";
    const userIdFromUrl =
      pathSegments.length === 4 && pathSegments[2] === "t"
        ? pathSegments[3]
        : null;

    if (userIdFromUrl && currentUser) {
      if (
        selectedConversation?.otherParticipant?._id !== userIdFromUrl ||
        !selectedConversation
      ) {
        initiateConversationWithUser(userIdFromUrl);
      }
    }
  }, [
    location.pathname,
    currentUser,
    initiateConversationWithUser,
    selectedConversation,
  ]);

  useEffect(() => {
    const fetchUserConversations = async () => {
      if (!currentUser) return;
      setLoadingConversations(true);
      try {
        const { data } = await axios.get("/api/chat/conversations"); // Fetch conversations
        setConversationsList(
          data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        ); // Sort initially
      } catch (err) {
        toast.error("Failed to load conversations.");
        console.error("Error fetching user conversations:", err);
      } finally {
        setLoadingConversations(false);
      }
    };
    fetchUserConversations();
  }, [currentUser]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageForList = (newMessage) => {
      setConversationsList((prevList) => {
        let conversationExists = false;
        const updatedList = prevList.map((convo) => {
          if (
            convo._id ===
            (newMessage.conversation?._id || newMessage.conversation)
          ) {
            conversationExists = true;
            return {
              ...convo,
              lastMessage: newMessage,
              updatedAt: newMessage.createdAt,
            };
          }
          return convo;
        });

        if (!conversationExists && newMessage.conversation) {
          const newConvoPlaceholder = {
            _id: newMessage.conversation._id || newMessage.conversation,
            participants: newMessage.conversation.participants || [
              newMessage.sender,
              { _id: currentUser._id },
            ], 
            lastMessage: newMessage,
            updatedAt: newMessage.createdAt,
          };
        }

        return updatedList.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    };
    socket.on("messageReceived", handleMessageForList);
    return () => socket.off("messageReceived", handleMessageForList);
  }, [socket, currentUser]);

  const showChatWindowOnlyOnMobile =
    selectedConversation && window.innerWidth < 768;

  const showConversationList =
    !isMobileView || (isMobileView && !selectedConversation);
  const showChatWindow =
    !isMobileView || (isMobileView && selectedConversation);

  return (
    <MainLayout>
      {" "}
      <div className="chat-page-bg flex h-[calc(100vh-4rem)] overflow-hidden">
        {" "}
        {showConversationList && (
          <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Chats</h2>
            </div>
            <div className="flex-grow overflow-y-auto">
              {loadingConversations && (
                <p className="p-4 text-sm text-gray-500">Loading chats...</p>
              )}
              {error && <p className="p-4 text-sm text-red-500">{error}</p>}
              {!loadingConversations &&
                conversationsList.map((convo) => {
                  const otherParticipant = convo.participants.find(
                    (p) => p._id.toString() !== currentUser?._id.toString()
                  );
                  if (!otherParticipant) {
                    return null;
                  }
                  const individualUnreadCount = unreadMessages[convo._id] || 0;

                  return (
                    <FriendListItem
                      key={convo._id} 
                      friend={otherParticipant} 
                      isOnline={onlineUsers.includes(otherParticipant._id)}
                      onSelectConversation={initiateConversationWithUser}
                      isActiveConvo={selectedConversation?.id === convo._id}
                      unreadCount={individualUnreadCount}
                      lastMessage={convo.lastMessage}
                    />
                  );
                })}
            </div>
          </div>
        )}
        <div
          className={`flex-grow flex flex-col bg-white ${
            showChatWindowOnlyOnMobile
              ? "w-full flex"
              : selectedConversation
              ? "flex"
              : "hidden md:flex"
          }`}
        >
          {loadingSelectedConvo && ( 
            <div className="flex-grow flex items-center justify-center">
              <p>Loading conversation...</p>
            </div>
          )}
          {selectedConversation && !loadingSelectedConvo ? (
            <ChatWindow
              conversationId={selectedConversation.id}
              otherParticipant={selectedConversation.otherParticipant}
            />
          ) : (
            !loadingSelectedConvo &&
            !location.pathname.startsWith("/chat/t/") && (
              <div className="flex-grow flex items-center justify-center p-4">
                <div className="text-center">
                  <ChatBubbleLeftEllipsisIcon className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-black">
                    Select a chat
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start a conversation by selecting one from the list.
                  </p>
                </div>
              </div>
            )
          )}
          {error && !selectedConversation && !loadingSelectedConvo && (
            <div className="flex-grow flex items-center justify-center p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
