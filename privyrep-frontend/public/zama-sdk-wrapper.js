// Wrapper script to expose Zama SDK to window.ZamaSDK
// This script runs after the CDN script loads

(function() {
  'use strict';

  // Wait for the SDK to be available
  const checkSDK = setInterval(() => {
    // Check if the SDK exports are available in the global scope
    if (typeof initSDK !== 'undefined' && typeof createInstance !== 'undefined' && typeof SepoliaConfig !== 'undefined') {
      console.log('[Zama SDK Wrapper] Found SDK exports in global scope');

      // Expose to window.ZamaSDK
      window.ZamaSDK = {
        initSDK: initSDK,
        createInstance: createInstance,
        SepoliaConfig: SepoliaConfig
      };

      console.log('[Zama SDK Wrapper] SDK ready on window.ZamaSDK');
      clearInterval(checkSDK);

      // Dispatch custom event to notify SDK is ready
      window.dispatchEvent(new Event('zamaSDKReady'));
    }
  }, 50);

  // Timeout after 10 seconds
  setTimeout(() => {
    if (!window.ZamaSDK) {
      clearInterval(checkSDK);
      console.error('[Zama SDK Wrapper] Timeout: SDK not found after 10 seconds');
    }
  }, 10000);
})();
