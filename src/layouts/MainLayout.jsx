import React from 'react';
import Navbar from '../components/common/Navbar';

const MainLayout = ({ children, onOpenCreatePostModal }) => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar onOpenCreatePostModal={onOpenCreatePostModal} />
            <main className="flex-grow pt-16">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;