import React, { Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Popover, Transition } from "@headlessui/react";
import { useAuth } from "../contexts/AuthContext";
import { SiLinkedin, SiInstagram } from "react-icons/si";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/signup");
    }
  };

  const socialLinks = [
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/animesh-khare-951282289/",
      icon: SiLinkedin,
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/animesh_khare001/",
      icon: SiInstagram,
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-10">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`
                                        text-sm font-semibold text-black transition-colors outline-none
                                        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75
                                        ${
                                          open
                                            ? "text-blue-600"
                                            : "hover:text-blue-600"
                                        }
                                    `}
                >
                  CONTACT DEV
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute right-0 mt-2 w-max origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                    <div className="flex flex-col p-2 space-y-1">
                      {socialLinks.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center rounded-md px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-black transition-colors"
                        >
                          <item.icon
                            className="mr-3 h-5 w-5 text-gray-500 group-hover:text-black transition-colors"
                            aria-hidden="true"
                          />
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center text-center px-4">
        <div className="space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-6xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter"
          >
            <span style={{ color: "#526DFF" }} className="tracking-widest">
              H
            </span>
            <span className="text-black tracking-widest">AVEN</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl font-bold tracking-widest space-y-2"
            style={{ color: "#526DFF" }}
          >
            <p>BE HUMAN, NOT HASHTAGS.</p>
            <p>REAL VOICES. REAL CONNECTIONS.</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            className="text-sm sm:text-base font-semibold text-gray-500"
          >
            YOUR SOCIAL-MEDIA APPLICATION
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.6,
            }}
          >
            <button
              onClick={handleGetStarted}
              className="text-lg font-bold text-white rounded-full px-10 py-4 shadow-lg transition-transform transform hover:scale-105"
              style={{ backgroundColor: "#526DFF" }}
            >
              GET STARTED
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
