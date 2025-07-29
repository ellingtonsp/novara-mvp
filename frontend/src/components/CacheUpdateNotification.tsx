// Cache Update Notification Component
// Shows users when a new version is available and handles refresh

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Sparkles } from 'lucide-react';

export const CacheUpdateNotification: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      // Listen for broadcast channel messages
      const updateChannel = new BroadcastChannel('sw-updates');
      
      updateChannel.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          console.log('[Cache Update] New version available:', event.data.version);
          setShowNotification(true);
        }
      });

      // Check for waiting service worker
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setShowNotification(true);
        }

        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowNotification(true);
              }
            });
          }
        });
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Auto-refresh when new SW takes control
        window.location.reload();
      });
    }

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Tell waiting service worker to skip waiting
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      // Small delay to ensure SW activation
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('[Cache Update] Refresh failed:', error);
      // Force reload anyway
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    // Store dismissal with timestamp
    localStorage.setItem('cache_update_dismissed', new Date().toISOString());
  };

  if (!showNotification) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-1">
                Update Available!
              </h3>
              <p className="text-sm text-purple-700 mb-3">
                We've made improvements to Novara. Refresh to get the latest features and fixes.
              </p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Now
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  Later
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-purple-400 hover:text-purple-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};