import React, { useState, Fragment} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Popover, Transition } from "@headlessui/react";
import {
  PlusCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowLeftOnRectangleIcon,
  UserGroupIcon,
  UserPlusIcon,
  UsersIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../contexts/SocketContext";

const Navbar = ({ onOpenCreatePostModal }) => {
  const { user, logoutUser } = useAuth();
  const { totalUnreadCount, pendingFriendRequests } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const friendRequestCount = pendingFriendRequests.length;
  const showCreatePostIcon = location.pathname === "/dashboard";
  const defaultProfilePic =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' class='w-6 h-6'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' clip-rule='evenodd' /%3E%3C/svg%3E";

  const handleLogout = () => {
    logoutUser();
    navigate("/signin");
  };

  if (!user) return null;
  const dropdownItems = [
    { name: "My Profile", href: `/profile/${user._id}`, icon: UserCircleIcon },
    { name: "My Friends", href: "/friends", icon: UsersIcon },
    {
      name: "Friend Requests",
      href: "/friend-requests",
      icon: UserGroupIcon,
      notificationCount: friendRequestCount,
    },
    { name: "Find Friends", href: "/find-friends", icon: UserPlusIcon },
  ];

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-3xl font-bold text-black">
              Haven
            </Link>
          </div>
          <div className="flex items-center space-x-3 md:space-x-5">
            {showCreatePostIcon && user.isProfileComplete && (
              <button
                onClick={onOpenCreatePostModal}
                title="Create Post"
                className="p-1 rounded-full text-gray-600 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                <PlusCircleIcon className="h-7 w-7" aria-hidden="true" />
              </button>
            )}
            <Link
              to="/chat"
              title="Chat"
              className="p-1 rounded-full text-gray-600 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black relative"
            >
              <ChatBubbleLeftEllipsisIcon
                className="h-7 w-7"
                aria-hidden="true"
              />
              {totalUnreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                </span>
              )}
            </Link>
            <Popover className="relative">
              <Popover.Button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                <span className="sr-only">Open user menu</span>
                <img
                  className="h-9 w-9 rounded-full object-cover border-2 border-gray-300"
                  src={user.profilePictureUrl || defaultProfilePic}
                  alt={user.username}
                />
                {friendRequestCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 transform translate-x-1/4 -translate-y-1/4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center ring-2 ring-white">
                    {friendRequestCount}
                  </span>
                )}
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Popover.Panel className="absolute right-0 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                  <div className="px-1 py-1">
                    {dropdownItems.map((item) => (
                      <Popover.Button // Use Popover.Button to close panel on click
                        key={item.name}
                        as={Link} // Render it as a Link component
                        to={item.href}
                        className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black"
                      >
                        <item.icon
                          className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-600"
                          aria-hidden="true"
                        />
                        <span className="flex-grow text-left">{item.name}</span>

                        {/* --- THE BADGE FOR FRIEND REQUESTS LINK --- */}
                        {item.notificationCount > 0 && (
                          <span className="ml-auto bg-blue-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                            {item.notificationCount}
                          </span>
                        )}
                        {/* --- END BADGE --- */}
                      </Popover.Button>
                    ))}
                  </div>
                  <div className="px-1 py-1">
                    <Popover.Button
                      as="button"
                      onClick={handleLogout}
                      className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black"
                    >
                      <ArrowLeftOnRectangleIcon
                        className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-600"
                        aria-hidden="true"
                      />
                      Sign out
                    </Popover.Button>
                  </div>
                </Popover.Panel>
              </Transition>
            </Popover>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
