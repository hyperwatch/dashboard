import { useState, useEffect, useRef, useCallback } from 'react';

export default function useWebSocket(
  url,
  { maxEntries = 500, historyUrl, filter } = {}
) {
  const [entries, setEntries] = useState([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const wsRef = useRef(null);
  const pausedRef = useRef(false);
  const bufferRef = useRef([]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!url) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = url.startsWith('ws')
      ? url
      : `${protocol}//${window.location.host}${url}`;

    let ws;
    let reconnectTimer;
    let cancelled = false;

    function addEntry(entry) {
      if (filter && !filter(entry)) return;
      if (pausedRef.current) {
        bufferRef.current.push(entry);
        if (bufferRef.current.length > maxEntries) {
          bufferRef.current = bufferRef.current.slice(-maxEntries);
        }
      } else {
        // New entries go to the end of the list: newest at the bottom.
        setEntries((prev) => {
          const next = [...prev, entry];
          return next.length > maxEntries ? next.slice(-maxEntries) : next;
        });
      }
    }

    function connectWs() {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          addEntry(JSON.parse(event.data));
        } catch {
          // ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          reconnectTimer = setTimeout(connectWs, 3000);
        }
      };

      ws.onerror = () => ws.close();
    }

    // Connect WebSocket immediately, fetch history in parallel
    // Buffer live entries until history arrives, then prepend history
    const liveBuffer = [];
    let historyLoaded = false;

    connectWs();

    if (historyUrl) {
      // Temporarily intercept addEntry to buffer live entries until history is ready
      const origOnMessage = ws.onmessage;
      ws.onmessage = (event) => {
        try {
          const entry = JSON.parse(event.data);
          if (!historyLoaded) {
            liveBuffer.push(entry);
          } else {
            addEntry(entry);
          }
        } catch {
          // ignore
        }
      };

      fetch(historyUrl)
        .then((res) => res.json())
        .then((history) => {
          if (cancelled) return;
          historyLoaded = true;
          const filtered = filter
            ? (Array.isArray(history) ? history : []).filter(filter)
            : Array.isArray(history)
              ? history
              : [];
          // Entries are rendered top-to-bottom with the scroll stuck to the
          // bottom, and live entries are appended -- so the list is oldest
          // first, newest last. /history/*.json answers newest first, so flip
          // it to keep one chronological order across the seam. This also
          // makes the maxEntries trim below drop the oldest, not the newest.
          const combined = [...filtered.reverse(), ...liveBuffer];
          const trimmed =
            combined.length > maxEntries
              ? combined.slice(-maxEntries)
              : combined;
          setEntries(trimmed);
          // Restore normal message handling
          ws.onmessage = (event) => {
            try {
              addEntry(JSON.parse(event.data));
            } catch {}
          };
        })
        .catch(() => {
          if (cancelled) return;
          historyLoaded = true;
          if (liveBuffer.length > 0) setEntries(liveBuffer.slice(-maxEntries));
          ws.onmessage = (event) => {
            try {
              addEntry(JSON.parse(event.data));
            } catch {}
          };
        });
    }

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [url, maxEntries, historyUrl, filter]);

  const resume = useCallback(() => {
    setPaused(false);
    if (bufferRef.current.length > 0) {
      setEntries((prev) => {
        const next = [...prev, ...bufferRef.current];
        bufferRef.current = [];
        return next.length > maxEntries ? next.slice(-maxEntries) : next;
      });
    }
  }, [maxEntries]);

  const clear = useCallback(() => {
    setEntries([]);
    bufferRef.current = [];
  }, []);

  return { entries, connected, paused, setPaused, resume, clear };
}
