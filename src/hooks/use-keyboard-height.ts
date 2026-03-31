"use client";

import { useState, useEffect } from "react";

/**
 * Returns the current virtual keyboard height on mobile browsers
 * by comparing window.innerHeight with visualViewport.height.
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function onResize() {
      // The difference between the layout viewport and the visual viewport
      // gives us the keyboard height on mobile browsers.
      const kbHeight = Math.max(0, Math.round(window.innerHeight - vv!.height));
      setKeyboardHeight(kbHeight);
    }

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  return keyboardHeight;
}
