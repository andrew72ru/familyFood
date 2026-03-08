import { useEffect, useRef } from 'react';

const DEFAULT_HUB_URL = process.env.REACT_APP_MERCURE_HUB_URL || 'https://localhost/.well-known/mercure';
const IS_DEV = process.env.NODE_ENV === 'development';

export const useMercure = (topics: string | string[], onUpdate: (data: any) => void, customHubUrl?: string | null) => {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!topics || (Array.isArray(topics) && topics.length === 0)) {
      return;
    }

    const hubUrl = customHubUrl || DEFAULT_HUB_URL;
    const url = new URL(hubUrl);
    const topicsArray = Array.isArray(topics) ? topics : [topics];

    topicsArray.forEach((topic) => {
      url.searchParams.append('topic', topic);
    });

    if (IS_DEV) {
      console.log(`[Mercure] Connecting to ${url.toString()}`);
    }

    const eventSource = new EventSource(url.toString());

    eventSource.onopen = () => {
      if (IS_DEV) {
        console.log(`[Mercure] Connected to hub: ${hubUrl}`);
      }
    };

    eventSource.onmessage = (event) => {
      try {
        if (IS_DEV) {
          console.log('[Mercure] Message received:', event.data);
        }
        const data = JSON.parse(event.data);
        onUpdateRef.current(data);
      } catch (e) {
        console.error('[Mercure] Failed to parse message', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[Mercure] EventSource error', error);
      // EventSource will automatically try to reconnect unless closed
    };

    return () => {
      if (IS_DEV) {
        console.log(`[Mercure] Closing connection to ${hubUrl}`);
      }
      eventSource.close();
    };
  }, [topics, customHubUrl]);
};
