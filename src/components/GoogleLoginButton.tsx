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
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '20154548950-uhhvonq6a65a5bacd6096ckp35l0ofp1.apps.googleusercontent.com';

  const renderGoogleButton = useCallback(() => {
    if (window.google?.accounts?.id && buttonRef.current) {
      try {
        if (!isInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res: any) => {
              if (res?.credential) {
                onSuccessRef.current?.(res.credential);
              } else if (onErrorRef.current) {
                onErrorRef.current('Failed to obtain Google credential');
              }
            },
          });
          isInitializedRef.current = true;
        }

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
  }, [clientId]);

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
