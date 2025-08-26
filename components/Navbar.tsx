"use client";

import { BookOpen, X } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

const NavbarWrapper = ({children}: {children: React.ReactNode}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div>
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={'/'} className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Pinyin</h1>
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <Link href="/about">
                  <button className="inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2">
                    About
                  </button>
                </Link>
                <Link href="/help">
                  <button className="inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2">
                    Help
                  </button>
                </Link>
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button 
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <line x1="4" x2="20" y1="12" y2="12" />
                      <line x1="4" x2="20" y1="6" y2="6" />
                      <line x1="4" x2="20" y1="18" y2="18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay and drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMobileMenu}
          />
          
          {/* Slide-in menu */}
          <div className="fixed top-0 right-0 h-full w-64 bg-background border-l border-border shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden"
               style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)' }}>
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button 
                  onClick={closeMobileMenu}
                  className="p-1 rounded-md hover:bg-accent"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <nav className="p-5">
              <ul className="space-y-4">
                <li>
                  <Link href="/" onClick={closeMobileMenu}>
                    <div className="block py-2 px-3 rounded-md hover:bg-accent transition-colors font-medium">
                      Home
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/about" onClick={closeMobileMenu}>
                    <div className="block py-2 px-3 rounded-md hover:bg-accent transition-colors font-medium">
                      About
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/help" onClick={closeMobileMenu}>
                    <div className="block py-2 px-3 rounded-md hover:bg-accent transition-colors font-medium">
                      Help
                    </div>
                  </Link>
                </li>
                {/* Add more menu items as needed */}
                <li>
                  <Link href="/admin" onClick={closeMobileMenu}>
                    <div className="block py-2 px-3 rounded-md hover:bg-accent transition-colors font-medium">
                      Admin
                    </div>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}

      {children}
    </div>
  )
}

export default NavbarWrapper