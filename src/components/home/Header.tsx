import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-10">
          {/* Logo and site name */}
          <Link href="/" className="text-xl font-bold text-gray-800">
            安心予算AI診断
          </Link>
          
          {/* Navigation links */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/diagnosis" className="text-gray-700 hover:text-gray-900 font-medium">
              住宅予算診断
            </Link>
            <Link href="/fp-consultation" className="text-gray-700 hover:text-gray-900 font-medium">
              FP相談予約
            </Link>
          </nav>
        </div>

        {/* Login/Register buttons */}
        <div className="space-x-2">
          <Link href="/login" className="text-gray-600 hover:text-gray-800">
            ログイン
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 