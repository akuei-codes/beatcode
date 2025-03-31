
import React from 'react';
import { Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-icon-dark-gray border-t border-icon-gray/50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex items-center justify-center md:justify-start">
            <span className="text-icon-accent text-xl font-bold tracking-tight">ICON</span>
            <span className="ml-1 text-icon-white/50 text-sm">| Competitive Coding Platform</span>
          </div>
          
          <div className="flex justify-center md:justify-end mt-4 md:mt-0 space-x-6">
            <a
              href="#"
              className="text-icon-light-gray hover:text-icon-accent transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-icon-gray/30 pt-6">
          <p className="text-center text-sm text-icon-light-gray">
            &copy; {new Date().getFullYear()} ICON. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
