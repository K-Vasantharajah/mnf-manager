'use client';

import { useAuth } from '@/lib/auth';
import { GoogleLogin } from '@react-oauth/google';
import api from '@/lib/api';

export default function AuthNav() {
  const { user, isAdmin, login, logout } = useAuth();

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <div className="flex items-center gap-3">
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name}
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="text-right">
            <div className="text-xs text-green-200">{user.name}</div>
            {isAdmin && (
              <div className="text-xs text-green-400">Admin</div>
            )}
          </div>
          <button
            onClick={logout}
            className="text-xs text-green-300 hover:text-white border border-green-700 px-3 py-1 rounded-lg"
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
          theme="outline"
          size="medium"
          text="signin_with"
        />
      )}
    </div>
  );
}