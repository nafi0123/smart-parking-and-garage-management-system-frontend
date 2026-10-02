'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: any;
    handleGoogleCredentialResponse?: (response: any) => void;
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
  const initializedRef = useRef(false);

  // Keep refs updated
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '20154548950-uhhvonq6a65a5bacd6096ckp35l0ofp1.apps.googleusercontent.com';

  function initGoogle() {
    if (!window.google?.accounts?.id || !buttonRef.current) return;

    // Expose callback globally (required for redirect mode)
    window.handleGoogleCredentialResponse = (response: any) => {
      if (response?.credential) {
        onSuccessRef.current(response.credential);
      } else {
        onErrorRef.current?.('Failed to get Google credential. Please try again.');
      }
    };

    if (!initializedRef.current) {
      // Use SAME approach as working test-google page: ux_mode='redirect'
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: window.handleGoogleCredentialResponse,
        ux_mode: 'redirect',
        login_uri: 'https://smart-parking-backend-omega.vercel.app/test-google',
        auto_select: false,
      });
      initializedRef.current = true;
    }


    // Clear and re-render button
    buttonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'filled_blue',
      size: 'large',
      type: 'standard',
      text: 'continue_with',
      shape: 'rectangular',
      width: buttonRef.current.offsetWidth || 320,
    });
  }

  useEffect(() => {
    // Handle redirect callback: Google sends credential in the page as POST
    // The credential comes back as a URL hash or is handled by the GSI client
    const params = new URLSearchParams(window.location.search);
    const credential = params.get('credential');
    if (credential) {
      onSuccessRef.current(credential);
    }

    // Try to init if google is already loaded
    if (window.google?.accounts?.id) {
      initGoogle();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogle}
      />
      <div ref={buttonRef} className="w-full flex justify-center min-h-[42px]" />
    </>
  );
}
