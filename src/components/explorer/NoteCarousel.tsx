import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NoteCarouselProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  onViewAll?: () => void;
  viewAllLabel?: string;
  children: React.ReactNode;
}

export function NoteCarousel({
  title,
  subtitle,
  badge,
  icon,
  onViewAll,
  viewAllLabel = "View All",
  children
}: NoteCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to enable/disable navigation chevrons
  const checkScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScrollState();
    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);

    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [checkScrollState, children]);

  const scroll = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    // Scroll roughly 80% of viewable width or 2-3 cards
    const scrollAmount = Math.max(300, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  return (
    <section className="space-y-3.5 relative group/carousel">
      {/* Row Header */}
      <div className="flex items-end justify-between px-1 sm:px-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {icon && <span className="text-emerald-500 dark:text-emerald-400">{icon}</span>}
            <h3 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-2">
              <span>{title}</span>
              {badge && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {badge}
                </span>
              )}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side controls: View all & Navigation chevrons */}
        <div className="flex items-center gap-2 shrink-0">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline px-2 py-1 rounded transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {viewAllLabel}
            </button>
          )}

          {/* Desktop chevrons */}
          <div className="hidden sm:flex items-center gap-1 pl-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                canScrollLeft
                  ? "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 shadow-xs"
                  : "bg-slate-100/50 dark:bg-slate-900/50 border-transparent text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40"
              }`}
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                canScrollRight
                  ? "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 shadow-xs"
                  : "bg-slate-100/50 dark:bg-slate-900/50 border-transparent text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40"
              }`}
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={containerRef}
        className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 px-1 sm:px-2 focus-visible:outline-hidden"
        tabIndex={0}
        aria-label={`${title} carousel`}
      >
        {children}
      </div>
    </section>
  );
}
