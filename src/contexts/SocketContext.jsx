import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import io from "socket.io-client";
import axios from "axios";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const { user: currentUser } = useAuth();

  const serverURL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  useEffect(() => {
    if (currentUser) {
      axios
        .get("/api/friends/requests/pending")
        .then((res) => setPendingFriendRequests(res.data))
        .catch((err) =>
          console.error("Failed to fetch initial friend requests", err)
        );
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?._id) {
      const newSocket = io(serverURL, {});

      newSocket.emit("setup", currentUser._id);

      newSocket.on("connect", () => {
        console.log("Socket connected to server:", newSocket.id);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
      });

      newSocket.on("onlineUsersChanged", (users) => {
        setOnlineUsers(users);
      });
      newSocket.on("notificationForNewMessage", (notificationData) => {
        console.log(
          'CLIENT (SocketContext): Received "notificationForNewMessage"',
          notificationData
        );
        if (notificationData && notificationData.conversationId) {
          setUnreadMessages((prev) => ({
            ...prev,
            [notificationData.conversationId]:
              (prev[notificationData.conversationId] || 0) + 1,
          }));
        } else {
          console.warn(
            "CLIENT (SocketContext): Received notification without conversationId",
            notificationData
          );
        }
      });
      newSocket.on("newFriendRequest", (newRequest) => {
        console.log(
          'CLIENT (SocketContext): Received "newFriendRequest"',
          newRequest
        );
        setPendingFriendRequests((prev) => {
          if (prev.some((req) => req._id === newRequest._id)) {
            return prev;
          }
          return [newRequest, ...prev];
        });
        toast.info(
          `${
            newRequest.sender.fullName || newRequest.sender.username
          } sent you a friend request!`
        );
      });
      setSocket(newSocket);
      return () => {
        newSocket.emit("disconnectUser", currentUser._id);
        newSocket.disconnect();
        setSocket(null);
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
      setOnlineUsers([]);
      setPendingFriendRequests([]);
    }
  }, [currentUser, serverURL]);

  const clearUnreadMessagesForConversation = useCallback(
    (conversationIdToClear) => {
      setUnreadMessages((prev) => {
        if (!prev[conversationIdToClear]) return prev;
        const updated = { ...prev };
        delete updated[conversationIdToClear];
        return updated;
      });
    }
  );

  const clearFriendRequestNotifications = useCallback(() => {
    setPendingFriendRequests([]);
  }, []);

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
  }, [unreadMessages]);

  const contextValue = useMemo(
    () => ({
      socket,
      onlineUsers,
      unreadMessages,
      totalUnreadCount,
      clearUnreadMessagesForConversation,
      pendingFriendRequests,
      clearFriendRequestNotifications,
    }),
    [
      socket,
      onlineUsers,
      unreadMessages,
      totalUnreadCount,
      clearUnreadMessagesForConversation,
      pendingFriendRequests,
      clearFriendRequestNotifications
    ]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
