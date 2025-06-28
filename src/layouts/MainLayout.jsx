import React from "react";
import Navbar from "../components/common/Navbar";

const MainLayout = ({ children, onOpenCreatePostModal }) => {
  console.log(
    "2. MainLayout: Received onOpenCreatePostModal prop. Is it a function?",
    typeof onOpenCreatePostModal
  );
  return (
    <div className="min-h-screen bg-white">
      <Navbar onOpenCreatePostModal={onOpenCreatePostModal} />
      <main className="flex-grow pt-16">{children}</main>
    </div>
  );
};

export default MainLayout;
