import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4 mt-8">
      <div className="text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} SEPMzonline. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;