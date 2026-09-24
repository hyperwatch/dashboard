import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// State kept in the URL query string, so it survives reloads and switching to
// another instance (the instance links keep the query string). The parameter
// is dropped when set back to its default.
export default function useUrlState(key, defaultValue) {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === defaultValue || next === null || next === undefined) {
            params.delete(key);
          } else {
            params.set(key, next);
          }
          return params;
        },
        { replace: true }
      );
    },
    [key, defaultValue, setSearchParams]
  );

  return [value, setValue];
}
