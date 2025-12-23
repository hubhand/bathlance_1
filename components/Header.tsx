
import React from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-bathlance-cream via-bathlance-cream/90 to-bathlance-cream backdrop-blur-sm py-2 px-3 text-center sticky top-0 z-10 shadow-cute border-b-2 border-bathlance-orange/20">
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1"></div>
        <h1 className="text-2xl font-bold text-bathlance-orange drop-shadow-sm flex-1">
        🛁 BATHLANCE (배슬랜스)
      </h1>
        <div className="flex-1 flex justify-end items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-xs text-bathlance-brown hover:text-bathlance-orange transition-colors px-2 py-1 rounded-cute bg-white/60 hover:bg-white shadow-sm">
                로그인
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-xs bg-bathlance-orange text-white hover:bg-bathlance-brown transition-all px-3 py-1 rounded-cute shadow-cute hover:shadow-cute-lg">
                회원가입
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
      <p className="text-xs text-bathlance-brown font-medium">소중한 내 욕실용품 교체 알리미 ✨</p>
    </header>
  );
};
