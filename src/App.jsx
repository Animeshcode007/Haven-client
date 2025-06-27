import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/common/ProtectedRoute";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import FindFriendsPage from "./pages/FindFriendsPage";
import ChatPage from "./pages/ChatPage";
import LandingPage from "./pages/LandingPage";
import UserProfileRedirect from "./components/common/UserProfileRedirect";
import UserProfilePage from "./pages/UserProfilePage";
import FriendRequestsPage from "./pages/FriendRequestsPage";
import EditProfilePage from "./pages/EditProfilePage";
import FriendsListPage from "./pages/FriendsListPage";
import DashboardPage from "./pages/DashboardPage";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";

const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <h1 className="text-3xl font-bold">{title}</h1>
    <p className="mt-4">This page is under construction.</p>
    <Link
      to="/"
      className="mt-6 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
    >
      Go Home
    </Link>
  </div>
);

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute>
              <CompleteProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/find-friends"
          element={
            <ProtectedRoute>
              <FindFriendsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friend-requests"
          element={
            <ProtectedRoute>
              <FriendRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <FriendsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/t/:chatWithUserId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/me"
          element={
            <ProtectedRoute>
              <UserProfileRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <div className="chat-page-bg min-h-screen">
                <PlaceholderPage title="Chat Page" />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
