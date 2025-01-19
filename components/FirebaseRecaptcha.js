import React, { forwardRef, useImperativeHandle } from 'react';
import { WebView } from 'react-native-webview';

const FirebaseRecaptcha = forwardRef((props, ref) => {
  const webViewRef = React.useRef(null);

  useImperativeHandle(ref, () => ({
    show: () => {
      const js = `
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          'size': 'normal',
          'callback': (response) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: response }));
          },
          'expired-callback': () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expired' }));
          }
        });
        window.recaptchaVerifier.render();
      `;
      webViewRef.current?.injectJavaScript(js);
    },
    reset: () => {
      const js = `
        window.recaptchaVerifier && window.recaptchaVerifier.reset();
      `;
      webViewRef.current?.injectJavaScript(js);
    }
  }));

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
        <script>
          const firebaseConfig = {
            apiKey: "AIzaSyDxk_wGMSxJnaP-1cGJJVY-eQe0gxKIryo",
            authDomain: "agricult-ce0e3.firebaseapp.com",
            projectId: "agricult-ce0e3",
            storageBucket: "agricult-ce0e3.firebasestorage.app",
            messagingSenderId: "214344392349",
            appId: "1:214344392349:web:6967413117a8aca6a83e74"
          };
          firebase.initializeApp(firebaseConfig);
        </script>
        <style>
          #recaptcha-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
        </style>
      </head>
      <body>
        <div id="recaptcha-container"></div>
      </body>
    </html>
  `;

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      onMessage={(event) => {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'verify') {
          props.onVerify(data.token);
        } else if (data.type === 'expired') {
          props.onExpired();
        }
      }}
      style={{ flex: 1 }}
    />
  );
});

export default FirebaseRecaptcha;
