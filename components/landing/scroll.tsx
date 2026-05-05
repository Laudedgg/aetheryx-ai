"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveal — animates children in (fade + slide up) when the element
 * scrolls into view. Use `as` to choose the wrapper element.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  y = 24,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // @ts-expect-error — generic ref/Tag combo
  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0,0,0)" : `translate3d(0, ${y}px, 0)`,
        transition: `opacity .9s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 1s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * useScrollProgress — returns 0→1 as `ref` element scrolls through the viewport.
 * 0 when the element's top hits the bottom of the viewport, 1 when its bottom
 * leaves the top.
 */
export function useScrollProgress<T extends HTMLElement>(ref: React.RefObject<T>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // start counting when top hits viewport bottom; finish when bottom hits viewport top.
        const total = r.height + vh;
        const progressed = vh - r.top;
        const v = Math.max(0, Math.min(1, progressed / total));
        setP(v);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
  return p;
}

/**
 * useWindowScrollY — raw vertical scroll, throttled to rAF.
 */
export function useWindowScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY || 0));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return y;
}
