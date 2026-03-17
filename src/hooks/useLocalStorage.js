"use strict";

import { useState, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
  // Load saved data from localStorage
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);

    if (saved) {
      return JSON.parse(saved);
    }

    return initialValue;
  });

  // Save whenever value changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
