import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="flex flex-col md:flex-row justify-between items-center p-4 text-white">
            <div className="hover:underline mb-2 md:mb-0">
                {currentYear} @ SolanaChess
            </div>
         
        </footer>
    );
};

export default Footer;
