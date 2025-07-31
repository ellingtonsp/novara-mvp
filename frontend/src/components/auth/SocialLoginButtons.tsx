import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Apple } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../lib/environment';

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: any) => void;
        signIn: () => Promise<any>;
      };
    };
  }
}

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
  className?: string;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ 
  onSuccess, 
  className = '' 
}) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isAppleReady, setIsAppleReady] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check available providers
    fetch(`${API_BASE_URL}/api/auth/providers`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailableProviders(data.providers.map((p: any) => p.id));
        }
      })
      .catch(console.error);

    // Load Apple Sign In SDK
    if (availableProviders.includes('apple')) {
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.onload = () => {
        if (window.AppleID) {
          window.AppleID.auth.init({
            clientId: 'com.novara.health',
            scope: 'name email',
            redirectURI: window.location.origin,
            usePopup: true
          });
          setIsAppleReady(true);
        }
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [availableProviders]);

  const handleAppleSignIn = async () => {
    if (!window.AppleID || !isAppleReady) {
      console.error('Apple Sign In not ready');
      return;
    }

    setIsLoading(true);
    
    try {
      // Trigger Apple Sign In
      const response = await window.AppleID.auth.signIn();
      
      // Send to backend
      const authResponse = await fetch(`${API_BASE_URL}/api/auth/apple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: response.authorization.id_token,
          authorizationCode: response.authorization.code,
          user: response.user // Only provided on first sign in
        })
      });

      const data = await authResponse.json();

      if (data.success) {
        // Store auth data
        await login(data.user.email, data.token, data.user);
        
        // Check if profile needs completion
        if (data.needsProfileCompletion) {
          // Navigate to dashboard with completion flag
          navigate('/dashboard?complete-profile=true');
        } else {
          navigate('/dashboard');
        }
        
        onSuccess?.();
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Apple Sign In error:', error);
      // Show error to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Placeholder for Google Sign In
    console.log('Google Sign In not yet implemented');
  };

  if (availableProviders.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      {availableProviders.includes('apple') && (
        <Button
          onClick={handleAppleSignIn}
          disabled={!isAppleReady || isLoading}
          className="w-full bg-black hover:bg-gray-800 text-white"
          variant="outline"
        >
          <Apple className="w-5 h-5 mr-2" />
          {isLoading ? 'Signing in...' : 'Sign in with Apple'}
        </Button>
      )}

      {availableProviders.includes('google') && (
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </Button>
      )}
    </div>
  );
};