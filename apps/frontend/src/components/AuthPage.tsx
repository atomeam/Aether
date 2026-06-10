import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState } from 'react';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="flex mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-center rounded-l-lg ${
                mode === 'signin' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-center rounded-r-lg ${
                mode === 'signup' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>
          
          {mode === 'signin' ? (
            <SignIn 
              routing="hash"
              redirectUrl="/"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "bg-gray-800",
                }
              }}
            />
          ) : (
            <SignUp 
              routing="hash"
              redirectUrl="/"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "bg-gray-800",
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}