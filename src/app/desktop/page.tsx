'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './desktop.module.css';
import './override.css';

export const runtime = 'edge';

type TrackingState = 'STOPPED' | 'TRACKING' | 'AUTO_PAUSED';

function initNativeBridge() {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (!win.electronAPI && win.__TAURI__) {
      const core = win.__TAURI__.core;
      const event = win.__TAURI__.event;
      win.electronAPI = {
        platform: 'win32',
        startTracking: (data: any) => core.invoke('start_tracking', { userId: data?.userId || '' }),
        stopTracking: () => core.invoke('stop_tracking'),
        onScreenshot: (callback: (b64: string) => void) => {
          event.listen('screenshot-captured', (e: any) => callback(e.payload));
        },
        getSystemIdleTime: () => core.invoke('get_system_idle_time'),
        getActivityStats: () => core.invoke('get_activity_stats'),
        showNotification: (title: string, body: string) => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
          }
        }
      };
    }
  }
}
initNativeBridge();


export default function DesktopTracker() {
  const [trackingState, setTrackingState] = useState<TrackingState>('STOPPED');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null);
  const [idleLimit, setIdleLimit] = useState(0);
  const [realUserId, setRealUserId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<{ name?: string | null; email?: string | null } | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'logged_in' | 'logged_out'>('checking');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const realUserIdRef = React.useRef(realUserId);
  useEffect(() => {
    realUserIdRef.current = realUserId;
  }, [realUserId]);

  const loadSession = async () => {
    // 1. Try to restore cached user from localStorage immediately
    try {
      const cached = JSON.parse(localStorage.getItem('tracker_cached_user') || '{}');
      if (cached?.id) {
        setRealUserId(cached.id);
        realUserIdRef.current = cached.id;
        setUserProfile({ name: cached.name, email: cached.email });
        setAuthStatus('logged_in');
      }
    } catch (e) {}

    // 2. Fetch fresh session from server
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const session = await res.json();
        if (session?.user?.id) {
          setRealUserId(session.user.id);
          realUserIdRef.current = session.user.id;
          setUserProfile({ name: session.user.name, email: session.user.email });
          setAuthStatus('logged_in');
          try {
            localStorage.setItem('tracker_cached_user', JSON.stringify({
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
            }));
          } catch (e) {}
        } else {
          // No valid session — check if we have cached user
          const cached = JSON.parse(localStorage.getItem('tracker_cached_user') || '{}');
          if (cached?.id) {
            setAuthStatus('logged_in'); // Use cached session
          } else {
            setAuthStatus('logged_out');
          }
        }
      } else {
        const cached = JSON.parse(localStorage.getItem('tracker_cached_user') || '{}');
        setAuthStatus(cached?.id ? 'logged_in' : 'logged_out');
      }
    } catch (e) {
      // Offline - use cache if available
      try {
        const cached = JSON.parse(localStorage.getItem('tracker_cached_user') || '{}');
        setAuthStatus(cached?.id ? 'logged_in' : 'logged_out');
      } catch (e2) {
        setAuthStatus('logged_out');
      }
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.ok)) {
        await loadSession();
      } else {
        setLoginError(data.error || 'Email or password is incorrect.');
      }
    } catch (e) {
      setLoginError('Cannot connect to server.');
    }
    setLoginLoading(false);
  };

  useEffect(() => {
    initNativeBridge();
    loadSession();
  }, []);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format to H:MM (Trackabi standard for summary & days)
  const formatHourMin = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Format to MM:SS
  const formatMinSec = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [activitySeconds, setActivitySeconds] = useState(0);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [hoveredChart, setHoveredChart] = useState<'logged' | 'productivity' | 'apps' | null>(null);

  // --- Offline Sync Engine ---
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); syncOfflineQueue(); };
    const handleOffline = () => { setIsOffline(true); };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    
    if (navigator.onLine) syncOfflineQueue();

    // Occasional retry
    const syncInterval = setInterval(() => {
      if (navigator.onLine) syncOfflineQueue();
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  const syncOfflineQueue = async () => {
    if (syncing || !navigator.onLine) return;
    const queueStr = localStorage.getItem('tracker_offline_queue');
    if (!queueStr) return;
    
    let queue: any[] = [];
    try { queue = JSON.parse(queueStr); } catch (e) {}
    if (queue.length === 0) return;

    setSyncing(true);
    let remainingQueue = [...queue];

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: JSON.stringify(item.body),
        });
        if (!response.ok) throw new Error('API Error during sync');
        
        remainingQueue = remainingQueue.filter(q => q.id !== item.id);
        localStorage.setItem('tracker_offline_queue', JSON.stringify(remainingQueue));
      } catch (error) {
        console.error('Offline Sync failed for item, stopping sync batch.', error);
        break;
      }
    }
    setSyncing(false);
  };

  const enqueueRequest = (url: string, method: string, body: any) => {
    let queue: any[] = [];
    try { queue = JSON.parse(localStorage.getItem('tracker_offline_queue') || '[]'); } catch(e) {}
    
    // If it's a screenshot, limit offline queued screenshots to latest 8 to preserve localStorage quota
    if (url.includes('/screenshot')) {
      const screenshotItems = queue.filter(q => q.url.includes('/screenshot'));
      if (screenshotItems.length >= 8) {
        const oldestScreenshotId = screenshotItems[0].id;
        queue = queue.filter(q => q.id !== oldestScreenshotId);
      }
    }

    queue.push({
      id: Date.now() + '_' + Math.random().toString(36).substring(2),
      url,
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    try {
      localStorage.setItem('tracker_offline_queue', JSON.stringify(queue));
    } catch (quotaError) {
      console.warn('LocalStorage quota reached, pruning older screenshots to save critical timer data...', quotaError);
      // Strip all screenshots from queue and keep timer and activity events
      queue = queue.filter(q => !q.url.includes('/screenshot'));
      try {
        localStorage.setItem('tracker_offline_queue', JSON.stringify(queue));
      } catch (e) {
        console.error('Failed to write offline queue even after pruning', e);
      }
    }
  };

  const fetchWithOfflineQueue = async (url: string, method: string, body: any) => {
    if (navigator.onLine) {
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('API Error');
        return await response.json();
      } catch (error) {
        enqueueRequest(url, method, body);
        return { success: false, queued: true };
      }
    } else {
      enqueueRequest(url, method, body);
      return { success: false, queued: true };
    }
  };
  // ---------------------------

  // Fetch data when switching tabs or changing date
  useEffect(() => {
    const query = selectedDate ? `?date=${selectedDate}` : '';
    if (activeTab === 'screenshots') {
      fetch(`/api/tracker/screenshots${query}`).then(res => res.json()).then(data => {
        if (data.screenshots) setScreenshots(data.screenshots);
      });
    } else if (activeTab === 'timesheet') {
      fetch(`/api/tracker/timesheets${query}`).then(res => res.json()).then(data => {
        if (data.timeEntries) setTimesheets(data.timeEntries);
      });
    } else if (activeTab === 'summary') {
      fetch(`/api/tracker/summary${query}`).then(res => res.json()).then(data => {
        if (data.success) {
          setSummaryData(data.data);
          // Only initialize timers from DB if we haven't started a live session and we are viewing today
          if (!selectedDate || selectedDate === getLocalDateStr(new Date())) {
            setSecondsElapsed((prev) => prev === 0 ? data.data.totalSecondsToday || 0 : prev);
            setActivitySeconds((prev) => prev === 0 ? Math.min(data.data.totalSecondsToday || 0, data.data.totalActivitySecondsToday || 0) : prev);
            setIdleSeconds((prev) => prev === 0 ? data.data.totalIdleSecondsToday || 0 : prev);
          }
        }
      });
    }
  }, [activeTab, selectedDate]);

  // Initial load — fetch summary data on mount regardless of active tab
  useEffect(() => {
    fetch('/api/tracker/summary').then(res => res.json()).then(data => {
      if (data.success) {
        setSummaryData(data.data);
        setSecondsElapsed((prev) => prev === 0 ? data.data.totalSecondsToday || 0 : prev);
        setActivitySeconds((prev) => prev === 0 ? Math.min(data.data.totalSecondsToday || 0, data.data.totalActivitySecondsToday || 0) : prev);
        setIdleSeconds((prev) => prev === 0 ? data.data.totalIdleSecondsToday || 0 : prev);
      }
    });
  }, []);

  const lastTickTime = React.useRef<number>(0);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (trackingState === 'TRACKING') {
      lastTickTime.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const diffSecs = Math.floor((now - lastTickTime.current) / 1000);
        if (diffSecs >= 1) {
          setSecondsElapsed((prev) => prev + diffSecs);
          lastTickTime.current = lastTickTime.current + (diffSecs * 1000);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [trackingState]);



  // Activity Polling (approx every 10 seconds, but using true time diff for perfection)
  useEffect(() => {
    let activityInterval: NodeJS.Timeout;
    if (trackingState === 'TRACKING') {
      let lastActivitySync = Date.now();
      activityInterval = setInterval(async () => {
        const now = Date.now();
        const diffSecs = Math.max(1, Math.round((now - lastActivitySync) / 1000));
        lastActivitySync = now;

        if (typeof window !== 'undefined' && (window as any).electronAPI?.getActivityStats) {
          const stats = await (window as any).electronAPI.getActivityStats();
          // Benchmark: 3 inputs per second = 100% active
          const expectedActions = diffSecs * 3;
          const totalActions = stats.keystrokes + stats.mouseClicks;
          let intervalScore = Math.floor((totalActions / expectedActions) * 100);
          if (intervalScore > 100) intervalScore = 100;
          
          if (intervalScore > 0) {
            setActivitySeconds(prev => prev + diffSecs);
          } else {
            setIdleSeconds(prev => prev + diffSecs);
          }
          
          // Send to DB
          if (realUserId) {
            await fetchWithOfflineQueue('/api/tracker/activity', 'POST', {
              userId: realUserId,
              productivityScore: intervalScore,
              activeApps: JSON.stringify(stats.activeApps || []),
              offlineCreatedAt: new Date().toISOString()
            });
            // Refresh summary charts
            fetch('/api/tracker/summary').then(res => res.json()).then(data => {
              if (data.success) setSummaryData(data.data);
            });
          }
        }
      }, 10000);
    } else {

    }
    return () => clearInterval(activityInterval);
  }, [trackingState]);

  const trackingStateRef = React.useRef(trackingState);
  useEffect(() => {
    trackingStateRef.current = trackingState;
  }, [trackingState]);

  // Sync state on load
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.stopTracking(); // Ensure backend is stopped on reload
    }
  }, []);

  // Screenshot listener
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onScreenshot) {
      (window as any).electronAPI.onScreenshot(async (base64Image: string) => {
        try {
          if (trackingStateRef.current !== 'TRACKING') {
            console.log('Ignored screenshot because tracker is not active.');
            return;
          }
          
          let targetUid = realUserIdRef.current;
          if (!targetUid) {
            try {
              const session = await getSession();
              if (session?.user?.id) targetUid = session.user.id;
            } catch (e) {}
          }
          if (!targetUid) {
            try {
              const cached = JSON.parse(localStorage.getItem('tracker_cached_user') || '{}');
              if (cached?.id) targetUid = cached.id;
            } catch (e) {}
          }
          if (!targetUid) return;

          await fetchWithOfflineQueue('/api/tracker/screenshot', 'POST', {
            userId: targetUid,
            imageUrl: base64Image,
            offlineCreatedAt: new Date().toISOString()
          });
          console.log('Screenshot saved to DB.');
        } catch (error) {
          console.error('Failed to save screenshot:', error);
        }
      });
    }
  }, []);

  const notify = (title: string, body: string) => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.showNotification) {
      (window as any).electronAPI.showNotification(title, body);
    }
  };

  const getLocalDateStr = (date = new Date()) => {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  };

  const refreshData = () => {
    const query = selectedDate ? `?date=${selectedDate}` : '';
    fetch(`/api/tracker/screenshots${query}`).then(res => res.json()).then(data => {
      if (data.screenshots) setScreenshots(data.screenshots);
    });
    fetch(`/api/tracker/timesheets${query}`).then(res => res.json()).then(data => {
      if (data.timeEntries) setTimesheets(data.timeEntries);
    });
    fetch(`/api/tracker/summary${query}`).then(res => res.json()).then(data => {
      if (data.success) {
        setSummaryData(data.data);
        if (trackingStateRef.current === 'STOPPED' && (!selectedDate || selectedDate === getLocalDateStr(new Date()))) {
          setSecondsElapsed(data.data.totalSecondsToday || 0);
          setActivitySeconds(data.data.totalActivitySecondsToday || 0);
          setIdleSeconds(data.data.totalIdleSecondsToday || 0);
        }
      }
    });
  };

  const startTrackingLogic = async (isResume = false) => {
    if (!realUserId) return; // Prevent starting without user

    setTrackingState('TRACKING');
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.startTracking({ userId: realUserId });
    }
    
    notify('Time Tracker Started', isResume ? 'Welcome back! Resuming timer.' : 'Timer has been started manually.');

    const generatedTimeEntryId = 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    setTimeEntryId(generatedTimeEntryId);

    try {
      const data = await fetchWithOfflineQueue('/api/tracker/start', 'POST', {
        userId: realUserId, 
        projectId: null,
        timeEntryId: generatedTimeEntryId,
        offlineStartTime: new Date().toISOString()
      });
      
      if (data && data.success) {
        if (data.idleTimeoutMinutes) {
          setIdleLimit(data.idleTimeoutMinutes);
        }
        refreshData();
      }
    } catch (error) {
      console.error('Failed to start tracking API:', error);
    }
  };

  const stopTrackingLogic = async (isAutoPause = false) => {
    setTrackingState(isAutoPause ? 'AUTO_PAUSED' : 'STOPPED');
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.stopTracking();
    }

    notify(
      isAutoPause ? 'Time Tracker Paused' : 'Time Tracker Stopped',
      isAutoPause ? 'Paused due to inactivity.' : 'Timer has been stopped manually.'
    );

    if (timeEntryId) {
      try {
        await fetchWithOfflineQueue('/api/tracker/stop', 'POST', { 
          timeEntryId,
          offlineEndTime: new Date().toISOString()
        });
        setTimeEntryId(null);
        refreshData();
      } catch (error) {
        console.error('Failed to stop tracking API:', error);
      }
    }
  };

  const toggleManualTracking = async () => {
    if (trackingState === 'STOPPED' || trackingState === 'AUTO_PAUSED') {
      await startTrackingLogic(false);
    } else {
      await stopTrackingLogic(false);
    }
  };

  // Idle check & Auto-Resume logic
  useEffect(() => {
    let idleCheckInterval: NodeJS.Timeout;
    
    idleCheckInterval = setInterval(async () => {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.getSystemIdleTime) {
        const systemIdleTimeSecs = await (window as any).electronAPI.getSystemIdleTime();
        
        // AUTO PAUSE
        if (trackingState === 'TRACKING' && idleLimit > 0) {
          if (systemIdleTimeSecs >= (idleLimit * 60)) {
            console.log('Idle limit reached. Auto-pausing tracker.');
            stopTrackingLogic(true);
          }
        }
        
        // AUTO RESUME
        if (trackingState === 'AUTO_PAUSED') {
          // If idle drops to near 0, user moved mouse/keyboard
          if (systemIdleTimeSecs < 2) {
            console.log('Activity detected. Auto-resuming tracker.');
            startTrackingLogic(true);
          }
        }
      }
    }, 2000); // Check every 2 seconds for responsiveness
    
    return () => clearInterval(idleCheckInterval);
  }, [trackingState, idleLimit, timeEntryId]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeftState(scrollRef.current?.scrollLeft || 0);
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  // Center the active date on load and when summaryData arrives
  useEffect(() => {
    if (scrollRef.current) {
      // Use setTimeout to ensure the DOM has updated with the new items
      setTimeout(() => {
        if (!scrollRef.current) return;
        const activeElement = scrollRef.current.querySelector(`.${styles.dayCardActive}`) as HTMLElement;
        if (activeElement) {
          const containerCenter = scrollRef.current.clientWidth / 2;
          const itemCenter = activeElement.offsetLeft + activeElement.clientWidth / 2;
          scrollRef.current.scrollLeft = itemCenter - containerCenter;
        }
      }, 50);
    }
  }, [summaryData]);

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && !(e.target as Element).closest('.menu-container')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const isTodaySelected = !selectedDate || selectedDate === getLocalDateStr(new Date());
  const displayTotalSeconds = isTodaySelected ? secondsElapsed : (summaryData?.totalSecondsToday || 0);
  const displayActivitySeconds = isTodaySelected ? activitySeconds : (summaryData?.totalActivitySecondsToday || 0);
  const displayIdleSeconds = isTodaySelected ? idleSeconds : (summaryData?.totalIdleSecondsToday || 0);
  const isMacClient = typeof window !== 'undefined' && (window as any).electronAPI?.platform === 'darwin';

  // Show loading screen while checking session
  if (authStatus === 'checking') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0a0a0a' }}>
        <div style={{ color: '#64748b', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  // Show login screen if not logged in
  if (authStatus === 'logged_out') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0a0a0a', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ backgroundColor: '#171717', borderRadius: '16px', padding: '2rem', width: '320px', border: '1px solid #262626' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🕐</div>
            <h2 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>SigmaTracker</h2>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Sign in to start tracking</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="email"
              placeholder="Email address"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{ padding: '0.65rem 0.875rem', backgroundColor: '#262626', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', outline: 'none' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{ padding: '0.65rem 0.875rem', backgroundColor: '#262626', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', outline: 'none' }}
            />
            {loginError && <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>{loginError}</div>}
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              style={{ padding: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1 }}
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      {/* TOP HEADER (Drag Region) */}
      <div className={styles.dragRegion}>
        <div className={`menu-container ${styles.headerLeft}`} style={{ position: 'absolute', left: isMacClient ? '5.5rem' : '1.5rem', display: 'flex', alignItems: 'center', zIndex: 99999 }}>
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ 
              width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', WebkitAppRegion: 'no-drag', transition: 'background-color 0.2s', overflow: 'hidden'
            } as any}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            {summaryData?.avatarUrl ? (
              <img src={summaryData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (userProfile?.name || userProfile?.email || 'A').substring(0, 1).toUpperCase()
            )}
          </div>
          
          {isMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: '0', marginTop: '8px', 
              backgroundColor: '#171717', border: '1px solid #333', borderRadius: '10px',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.75)', width: '220px',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              WebkitAppRegion: 'no-drag', zIndex: 99999
            } as any}>
              {/* User Profile Header */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid #2a2a2a',
                backgroundColor: '#1f1f1f',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {summaryData?.avatarUrl ? (
                  <img src={summaryData.avatarUrl} alt="Avatar" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    backgroundColor: '#2563eb', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '14px', flexShrink: 0
                  }}>
                    {(userProfile?.name || userProfile?.email || 'A').substring(0, 1).toUpperCase()}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}>
                    {userProfile?.name || 'User'}
                  </div>
                  <div style={{
                    color: '#a3a3a3',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}>
                    {userProfile?.email || ''}
                  </div>
                </div>
              </div>

              <a href="/dashboard" target="_blank" style={{
                padding: '10px 14px', color: '#e5e5e5', fontSize: '13px', textDecoration: 'none',
                borderBottom: '1px solid #262626', transition: 'background-color 0.15s', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#262626'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Go to dashboard
              </a>
              
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                style={{
                  padding: '10px 14px', color: '#ef4444', fontSize: '13px', textDecoration: 'none',
                  background: 'transparent', border: 'none', width: '100%',
                  transition: 'background-color 0.15s', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#262626'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Log out
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.timerCenter}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ WebkitAppRegion: 'no-drag' } as any}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <div className={styles.timeValue}>{formatTime(secondsElapsed)}</div>
          
          <div className={styles.timerControls}>
            <button className={styles.controlBtn} onClick={toggleManualTracking} title={trackingState === 'TRACKING' ? 'Pause' : 'Start'}>
              {trackingState === 'TRACKING' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              )}
            </button>
            <button className={`${styles.controlBtn} ${styles.controlBtnStop}`} onClick={() => trackingState === 'TRACKING' && toggleManualTracking()} title="Stop">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"></rect></svg>
            </button>
          </div>
        </div>
      </div>

      {/* SUBHEADER: DATE & TIME LOGGED (TRACKABI STYLE) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 1.5rem', fontSize: '13px', color: '#a3a3a3' }}>
        <div>
          {(() => {
            const d = selectedDate ? new Date(selectedDate) : new Date();
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
          })()}
          <span style={{ margin: '0 8px', color: '#525252' }}>|</span>
          <span style={{ color: '#fff', fontWeight: 500 }}>{formatTime(displayTotalSeconds)}</span>
        </div>
        <div 
          style={{ color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          onClick={() => setSelectedDate(null)}
        >
          Today <span>&gt;</span>
        </div>
      </div>

      {/* CALENDAR STRIP */}
      <div 
        className={styles.calendarStrip}
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {summaryData?.weeklyTotals ? summaryData.weeklyTotals.map((day: any, i: number) => {
          // day.date is in YYYY-MM-DD local format from API
          // Compare with today's local date
          const now = new Date();
          const todayLocal = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
          const isToday = day.date === todayLocal;
          
          // Parse date for display
          const dParts = day.date.split('-');
          const d = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
          const displayDay = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const daySeconds = isToday && trackingState === 'TRACKING' ? secondsElapsed : day.seconds;

          const isSelected = selectedDate ? day.date === selectedDate : isToday;

          return (
            <div 
              key={i} 
              className={`${styles.dayCard} ${isSelected ? styles.dayCardActive : ''}`}
              onClick={() => setSelectedDate(day.date)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.dayName} style={{ color: isSelected ? '#fff' : undefined }}>{displayDay}</div>
              <div className={styles.dayTime} style={{ color: isSelected ? '#22c55e' : undefined, fontWeight: isSelected ? 600 : 400 }}>
                {formatHourMin(daySeconds)}
              </div>
              {isToday && (
                <div style={{ fontSize: '10px', color: '#22c55e', marginTop: '2px', fontWeight: 500 }}>Today</div>
              )}
            </div>
          );
        }) : (
          <div className={`${styles.dayCard} ${styles.dayCardActive}`}>
             <div className={styles.dayName} style={{ color: '#fff' }}>Loading...</div>
             <div className={styles.dayTime} style={{ color: '#fff' }}>0:00</div>
          </div>
        )}
      </div>

      {/* TABS BAR (TRACKABI STYLE) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', borderBottom: '1px solid #262626' }}>
        <button style={{ 
          background: '#1e293b', border: '1px solid #3b82f6', color: '#3b82f6', 
          borderRadius: '4px', padding: '3px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' 
        }}>
          <span style={{ fontSize: '13px', lineHeight: 1 }}>+</span> Add
        </button>

        <div className={styles.tabs} style={{ borderBottom: 'none' }}>
          <div 
            className={`${styles.tabItem} ${activeTab === 'summary' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </div>
          <div 
            className={`${styles.tabItem} ${activeTab === 'timesheet' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('timesheet')}
          >
            Timesheet
          </div>
          <div 
            className={`${styles.tabItem} ${activeTab === 'screenshots' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('screenshots')}
          >
            Screenshots
          </div>
        </div>

        <button 
          onClick={refreshData} 
          style={{ background: 'transparent', border: 'none', color: '#737373', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          title="Refresh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={styles.contentWrapper}>
        <div className={styles.content}>
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
              {/* LEFT COLUMN */}
              <div style={{ width: '35%', paddingRight: '1.5rem', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ color: '#a3a3a3', fontSize: '13px', marginBottom: '4px' }}>Time logged (h)</div>
                  <div style={{ color: '#fff', fontSize: '28px', fontWeight: 300 }}>{formatTime(displayTotalSeconds)}</div>
                  <div style={{ height: '4px', background: '#333', marginTop: '8px', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: '100%', background: '#404040', borderRadius: '2px' }}></div>
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#a3a3a3', fontSize: '13px', marginBottom: '4px' }}>Activity time (h)</div>
                  {(() => {
                    const displayIdle = displayIdleSeconds;
                    const displayActive = Math.max(0, displayTotalSeconds - displayIdle);
                    const activePct = displayTotalSeconds > 0 ? Math.min(100, Math.round((displayActive / displayTotalSeconds) * 100)) : 0;
                    const idlePct = displayTotalSeconds > 0 ? Math.max(0, 100 - activePct) : 0;
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <div style={{ color: '#fff', fontSize: '28px', fontWeight: 300 }}>
                            {formatTime(displayActive)}
                          </div>
                          <div style={{ color: '#a3a3a3', fontSize: '14px' }}>
                            {summaryData?.avgActivityScore ?? 0}%
                          </div>
                        </div>
                        <div style={{ height: '4px', background: '#333', marginTop: '8px', borderRadius: '2px', display: 'flex', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${activePct}%`, background: '#22c55e' }}></div>
                          <div style={{ height: '100%', width: `${idlePct}%`, background: '#eab308' }}></div>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '11px', color: '#e5e5e5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '1px' }}></div> 
                            <span>{formatTime(displayActive)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#eab308', borderRadius: '1px' }}></div> 
                            <span>{formatTime(displayIdle)}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div>
                  <div style={{ color: '#a3a3a3', fontSize: '13px', marginBottom: '8px' }}>Top active apps</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(summaryData?.topApps || []).map((app: any, i: number) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ width: '32px', height: '32px', background: app.color, borderRadius: '8px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: app.textColor, fontWeight: 'bold' }}>{app.name}</div>
                        <div style={{ color: '#a3a3a3', fontSize: '10px' }}>{app.percent}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ width: '65%', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                {(() => {
                  const displayHours = [6, 7, 8, 9, 10, 11, 12, 13];
                  
                  return (
                    <>
                      {/* TIME LOGGED BY HOUR */}
                      <div style={{ position: 'relative' }}>
                        <div style={{ color: '#a3a3a3', fontSize: '13px', marginBottom: '6px' }}>Time logged by hour</div>
                        <div style={{ display: 'flex', width: '100%', marginBottom: '6px', borderBottom: '1px solid #262626' }}>
                          {displayHours.map((h, idx) => (
                            <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#737373', borderLeft: idx > 0 ? '1px solid #262626' : 'none', padding: '2px 0' }}>
                              {String(h).padStart(2, '0')}:00
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '55px', gap: '4px', borderBottom: '1px solid #333', position: 'relative' }}>
                          {displayHours.map((h, idx) => {
                            const timePercent = summaryData?.hourlyTimeLogged?.[h] || 0;
                            return (
                              <div 
                                key={idx} 
                                style={{ flex: 1, background: hoveredHour === h && hoveredChart === 'logged' ? '#3b82f6' : '#525252', height: `${timePercent}%`, transition: 'background-color 0.15s, height 0.2s', cursor: 'pointer', borderRadius: '2px 2px 0 0' }}
                                onMouseEnter={() => { setHoveredHour(h); setHoveredChart('logged'); }}
                                onMouseLeave={() => { setHoveredHour(null); setHoveredChart(null); }}
                              ></div>
                            );
                          })}
                        </div>

                        {/* TOOLTIP POPUP FOR LOGGED TIME */}
                        {hoveredChart === 'logged' && hoveredHour !== null && (
                          <div style={{
                            position: 'absolute',
                            top: '35px',
                            left: `${Math.min(85, Math.max(15, ((displayHours.indexOf(hoveredHour) + 0.5) / displayHours.length) * 100))}%`,
                            transform: 'translate(-50%, 0)',
                            backgroundColor: '#121212',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                            zIndex: 9999,
                            minWidth: '170px',
                            pointerEvents: 'none'
                          }}>
                            {(() => {
                              const detail = summaryData?.hourlyDetails?.[hoveredHour];
                              return (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #262626', paddingBottom: '4px' }}>
                                    <span>⏱ {formatTime(detail?.loggedSeconds || 0)}</span>
                                    <span style={{ color: '#a3a3a3' }}>🕒 {detail?.hourLabel || `${String(hoveredHour).padStart(2,'0')}:00`}</span>
                                  </div>
                                  <div style={{ color: '#e5e5e5', fontSize: '12px' }}>
                                    Logged Time: <strong style={{ color: '#fff' }}>{formatTime(detail?.loggedSeconds || 0)}</strong>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      
                      {/* PRODUCTIVE VS UNPRODUCTIVE ACTIVITY BY HOUR (STACKED BAR) */}
                      <div style={{ position: 'relative' }}>
                        <div style={{ color: '#a3a3a3', fontSize: '13px', marginBottom: '6px' }}>Productive vs. unproductive activity by hour</div>
                        <div style={{ display: 'flex', width: '100%', marginBottom: '6px', borderBottom: '1px solid #262626' }}>
                          {displayHours.map((h, idx) => (
                            <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#737373', borderLeft: idx > 0 ? '1px solid #262626' : 'none', padding: '2px 0' }}>
                              {String(h).padStart(2, '0')}:00
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '55px', gap: '4px', borderBottom: '1px solid #333', position: 'relative' }}>
                          {displayHours.map((h, idx) => {
                            const d = summaryData?.hourlyDetails?.[h];
                            const activeSecs = d?.activeSeconds || 0;
                            const idleSecs = d?.idleSeconds || 0;
                            const activeH = Math.min(100, Math.floor((activeSecs / 3600) * 100));
                            const idleH = Math.min(100, Math.floor((idleSecs / 3600) * 100));
                            return (
                              <div 
                                key={idx} 
                                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column-reverse', justifyContent: 'flex-start', cursor: 'pointer', opacity: hoveredHour === h && hoveredChart === 'productivity' ? 0.85 : 1 }}
                                onMouseEnter={() => { setHoveredHour(h); setHoveredChart('productivity'); }}
                                onMouseLeave={() => { setHoveredHour(null); setHoveredChart(null); }}
                              >
                                {/* Productive (Active) Green Bar on Bottom */}
                                <div style={{ background: '#22c55e', height: `${activeH}%`, width: '100%', transition: 'height 0.2s', borderRadius: idleH === 0 ? '2px 2px 0 0' : '0' }}></div>
                                {/* Unproductive (Idle) Yellow Bar on Top */}
                                <div style={{ background: '#eab308', height: `${idleH}%`, width: '100%', transition: 'height 0.2s', borderRadius: '2px 2px 0 0' }}></div>
                              </div>
                            );
                          })}
                        </div>

                        {/* TOOLTIP POPUP FOR PRODUCTIVE VS UNPRODUCTIVE */}
                        {hoveredChart === 'productivity' && hoveredHour !== null && (
                          <div style={{
                            position: 'absolute',
                            top: '35px',
                            left: `${Math.min(85, Math.max(15, ((displayHours.indexOf(hoveredHour) + 0.5) / displayHours.length) * 100))}%`,
                            transform: 'translate(-50%, 0)',
                            backgroundColor: '#121212',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                            zIndex: 9999,
                            minWidth: '180px',
                            pointerEvents: 'none'
                          }}>
                            {(() => {
                              const detail = summaryData?.hourlyDetails?.[hoveredHour];
                              return (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #262626', paddingBottom: '4px' }}>
                                    <span>⏱ {formatTime(detail?.loggedSeconds || 0)}</span>
                                    <span style={{ color: '#a3a3a3' }}>🕒 {detail?.hourLabel || `${String(hoveredHour).padStart(2,'0')}:00`}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', fontSize: '12px', marginBottom: '4px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '2px', display: 'inline-block' }}></span>
                                      Productive
                                    </span>
                                    <span style={{ color: '#a3a3a3' }}>{formatTime(detail?.activeSeconds || 0)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', fontSize: '12px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ width: '10px', height: '10px', background: '#eab308', borderRadius: '2px', display: 'inline-block' }}></span>
                                      Unproductive
                                    </span>
                                    <span style={{ color: '#a3a3a3' }}>{formatTime(detail?.idleSeconds || 0)}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* ACTIVE APPS BY HOUR */}
                      <div style={{ position: 'relative' }}>
                        <div style={{ color: '#a3a3a3', fontSize: '13px', marginBottom: '6px' }}>Active apps</div>
                        <div style={{ display: 'flex', width: '100%', marginBottom: '6px', borderBottom: '1px solid #262626' }}>
                          {displayHours.map((h, idx) => (
                            <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#737373', borderLeft: idx > 0 ? '1px solid #262626' : 'none', padding: '2px 0' }}>
                              {String(h).padStart(2, '0')}:00
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '55px', gap: '4px', borderBottom: '1px solid #333', position: 'relative' }}>
                          {displayHours.map((h, idx) => {
                            const apps = summaryData?.hourlyApps?.[h] || [];
                            return (
                              <div 
                                key={idx} 
                                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column-reverse', justifyContent: 'flex-start', cursor: 'pointer', opacity: hoveredHour === h && hoveredChart === 'apps' ? 0.85 : 1 }}
                                onMouseEnter={() => { setHoveredHour(h); setHoveredChart('apps'); }}
                                onMouseLeave={() => { setHoveredHour(null); setHoveredChart(null); }}
                              >
                                {apps.map((app: any, j: number) => (
                                   <div key={j} style={{ background: app.color, height: `${app.p}%`, width: '100%' }}></div>
                                ))}
                              </div>
                            );
                          })}
                        </div>

                        {/* TOOLTIP POPUP FOR ACTIVE APPS */}
                        {hoveredChart === 'apps' && hoveredHour !== null && (
                          <div style={{
                            position: 'absolute',
                            top: '35px',
                            left: `${Math.min(85, Math.max(15, ((displayHours.indexOf(hoveredHour) + 0.5) / displayHours.length) * 100))}%`,
                            transform: 'translate(-50%, 0)',
                            backgroundColor: '#121212',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                            zIndex: 9999,
                            minWidth: '190px',
                            pointerEvents: 'none'
                          }}>
                            {(() => {
                              const detail = summaryData?.hourlyDetails?.[hoveredHour];
                              const totalAppTime = detail?.apps?.reduce((acc: number, item: any) => acc + item.duration, 0) || 0;
                              return (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #262626', paddingBottom: '4px' }}>
                                    <span>⏱ {formatTime(totalAppTime)}</span>
                                    <span style={{ color: '#a3a3a3' }}>🕒 {detail?.hourLabel || `${String(hoveredHour).padStart(2,'0')}:00`}</span>
                                  </div>
                                  {(!detail?.apps || detail.apps.length === 0) ? (
                                    <div style={{ color: '#737373', fontSize: '11px' }}>No active app logs</div>
                                  ) : (
                                    detail.apps.slice(0, 7).map((app: any, idx: number) => (
                                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', fontSize: '11px', marginBottom: '3px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                          <span style={{ width: '8px', height: '8px', background: app.color, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }}></span>
                                          {app.name}
                                        </span>
                                        <span style={{ color: '#a3a3a3', marginLeft: '8px' }}>{formatTime(app.duration)}</span>
                                      </div>
                                    ))
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'timesheet' && (
            <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
              {timesheets.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#a3a3a3', marginTop: '2rem' }}>No time logs today.</div>
              ) : (
                timesheets.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#1a1a1a', marginBottom: '8px', borderRadius: '6px' }}>
                    <div style={{ color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </div>
                    <div style={{ color: '#3b82f6', fontSize: '14px' }}>
                      {(!t.endTime && t.id === timeEntryId) ? formatTime(secondsElapsed) : formatTime(t.duration || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'screenshots' && (
            <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignContent: 'start', gridAutoRows: 'max-content' }}>
              {screenshots.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#a3a3a3', marginTop: '2rem' }}>No screenshots today.</div>
              ) : (
                screenshots.map(s => (
                  <div key={s.id} onClick={() => setFullScreenImage(s.imageUrl)} style={{ cursor: 'pointer', position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid #333' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '4px 8px', background: 'rgba(0,0,0,0.7)', color: '#3b82f6', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{new Date(s.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                      <span style={{ color: '#a3a3a3' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    <img src={s.imageUrl} alt="Screenshot" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      {fullScreenImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={() => setFullScreenImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '10px', WebkitAppRegion: 'no-drag' } as any}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img src={fullScreenImage} alt="Fullscreen" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
