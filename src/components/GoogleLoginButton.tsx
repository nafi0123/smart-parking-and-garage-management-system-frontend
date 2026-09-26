'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleLoginButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: (error: string) => void;
}

export default function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '20154548950-uhhvonq6a65a5bacd6096ckp35l0ofp1.apps.googleusercontent.com';

  const renderGoogleButton = useCallback(() => {
    if (window.google?.accounts?.id && buttonRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res: any) => {
            if (res?.credential) {
              onSuccess(res.credential);
            } else if (onError) {
              onError('Failed to obtain Google credential');
            }
          },
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'rectangular',
        });
      } catch (err: any) {
        console.error('Google button render error:', err);
      }
    }
  }, [clientId, onSuccess, onError]);

  useEffect(() => {
    renderGoogleButton();
  }, [renderGoogleButton]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={renderGoogleButton}
      />
      <div ref={buttonRef} className="w-full flex justify-center min-h-[42px]" />
    </>
  );
}
