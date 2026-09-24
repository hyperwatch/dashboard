import { useState, useEffect, useRef, useCallback } from 'react';

export default function usePolling(url, interval = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const urlRef = useRef(url);
  const controllerRef = useRef(null);
  const hasDataRef = useRef(false);

  const fetchData = useCallback(async (fetchUrl) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const res = await fetch(fetchUrl, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      hasDataRef.current = true;
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    urlRef.current = url;
    if (!hasDataRef.current) setLoading(true);
    fetchData(url);

    const id = setInterval(() => {
      fetchData(urlRef.current);
    }, interval);

    return () => {
      clearInterval(id);
      controllerRef.current?.abort();
    };
  }, [url, interval, fetchData]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchData(urlRef.current);
  }, [fetchData]);

  return { data, error, loading, retry };
}
