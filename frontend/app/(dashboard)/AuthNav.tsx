'use client';

import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { GoogleLogin } from '@react-oauth/google';
import api from '@/lib/api';

export default function AuthNav() {
  const { user, isAdmin, login, logout } = useAuth();

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <div className="flex items-center gap-2 sm:gap-3">
          {user.picture && (
            <div className="relative shrink-0">
              <Image
                src={user.picture}
                alt={user.name}
                width={30}
                height={30}
                className="rounded-full ring-1 ring-line"
                referrerPolicy="no-referrer"
              />
              {isAdmin && (
                <span
                  aria-hidden="true"
                  className="sm:hidden absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber ring-2 ring-ink"
                />
              )}
            </div>
          )}
          <div className="text-right hidden sm:block">
            <div className="text-xs text-paper">{user.name}</div>
            {isAdmin && <div className="text-xs text-amber mt-0.5">Admin</div>}
          </div>
          <button
            onClick={logout}
            className="text-xs text-muted hover:text-paper border border-line px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Sign out
          </button>
        </div>
      ) : (
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              const { data } = await api.post('/api/v1/auth/google', {
                idToken: credentialResponse.credential,
              });
              login({
                email: data.email,
                name: data.name,
                picture: data.picture,
                role: data.role,
                token: data.token,
              });
            } catch {
              alert('Login failed. Please try again.');
            }
          }}
          onError={() => alert('Google login failed')}
          useOneTap
          shape="pill"
          theme="filled_black"
          size="medium"
          text="signin_with"
        />
      )}
    </div>
  );
}
