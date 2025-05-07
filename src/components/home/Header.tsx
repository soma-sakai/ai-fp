import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              住宅予算AI診断
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/diagnosis" className="text-gray-700 hover:text-primary font-medium">
              診断
            </Link>
            <Link href="/fp-consultation" className="text-gray-700 hover:text-primary font-medium">
              FP相談
            </Link>
          </nav>
          
          <div className="flex items-center">
            <Link href="/diagnosis">
              <Button variant="primary" className="px-3 py-1.5 text-sm">診断を始める</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 