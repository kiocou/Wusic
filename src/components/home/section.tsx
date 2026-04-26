import {
  ArrowClockwise24Regular,
  CaretLeft24Filled,
  CaretRight24Filled,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import { ReactNode, useEffect, useRef, useState } from "react";
import { YeeButton } from "../yee-button";
import { motion } from "framer-motion";

interface SectionProps {
  title: string;
  children: ReactNode;
  seeMore?: boolean;
  refresh?: boolean;
  itemsPerPage?: number;
  itemWidth?: number;
}

export function Section({
  title,
  children,
  seeMore,
  refresh,
  itemsPerPage,
  itemWidth: _itemWidth,
}: SectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const getPagePositions = (container: HTMLDivElement) => {
    const childElements = Array.from(container.children) as HTMLElement[];
    if (childElements.length === 0) return [0];

    const containerRect = container.getBoundingClientRect();
    const maxScrollLeft = Math.max(
      0,
      container.scrollWidth - container.clientWidth,
    );
    const epsilon = 1;

    const items = childElements
      .map((child) => {
        const rect = child.getBoundingClientRect();
        const start = rect.left - containerRect.left + container.scrollLeft;

        return {
          start,
          end: start + rect.width,
        };
      })
      .sort((a, b) => a.start - b.start);

    if (itemsPerPage && itemsPerPage > 0) {
      return items
        .filter((_, index) => index % itemsPerPage === 0)
        .map((item) => Math.min(item.start, maxScrollLeft))
        .filter((position, index, arr) => arr.indexOf(position) === index);
    }

    const pagePositions = [0];
    let pageStart = 0;
    let pageEnd = container.clientWidth;

    for (const item of items) {
      if (item.end > pageEnd + epsilon) {
        pageStart = Math.min(item.start, maxScrollLeft);
        pageEnd = pageStart + container.clientWidth;

        if (pageStart > pagePositions[pagePositions.length - 1] + epsilon) {
          pagePositions.push(pageStart);
        }
      }
    }

    if (maxScrollLeft > pagePositions[pagePositions.length - 1] + epsilon) {
      pagePositions.push(maxScrollLeft);
    }

    return pagePositions;
  };

  const updateScrollState = () => {
    const container = containerRef.current;
    if (!container) {
      setHasOverflow(false);
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const epsilon = 1;
    const overflow = maxScrollLeft > epsilon;
    const pagePositions = getPagePositions(container);
    const currentScrollLeft = container.scrollLeft;
    const firstPage = pagePositions[0] ?? 0;
    const lastPage = pagePositions[pagePositions.length - 1] ?? 0;

    setHasOverflow(overflow);
    setCanScrollPrev(currentScrollLeft > firstPage + epsilon);
    setCanScrollNext(overflow && currentScrollLeft < lastPage - epsilon);
  };

  useEffect(() => {
    updateScrollState();

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [children]);

  const scrollToChild = (direction: 1 | -1) => {
    const container = containerRef.current;
    if (!container) return;

    const pagePositions = getPagePositions(container);
    const currentScrollLeft = container.scrollLeft;
    const epsilon = 1;

    const target =
      direction > 0
        ? (pagePositions.find(
            (position) => position > currentScrollLeft + epsilon,
          ) ?? currentScrollLeft)
        : ([...pagePositions]
            .reverse()
            .find((position) => position < currentScrollLeft - epsilon) ??
          currentScrollLeft);

    container.scrollTo({
      left: target,
      behavior: "smooth",
    });
  };

  const handlePrev = () => {
    scrollToChild(-1);
  };

  const handleNext = () => {
    scrollToChild(1);
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <motion.h2 
          className="text-2xl font-bold tracking-tight"
          whileHover={seeMore ? { x: 4 } : undefined}
          transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        >
          <div
            className={`flex items-center gap-2 group transform transition-all duration-300 ease-out ${
              seeMore
                ? "cursor-pointer hover:bg-foreground/5 rounded-md px-3 py-1.5 -ml-3 -mt-1.5"
                : ""
            }`}
          >
            {title}
            {seeMore && (
              <motion.div
                className="inline-flex"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight24Regular className="size-5 text-foreground/60" />
              </motion.div>
            )}
          </div>
        </motion.h2>

        <div className="flex gap-3 items-center">
          {hasOverflow && (
            <>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.1 }}>
                <YeeButton
                  variant="ghost"
                  icon={<CaretLeft24Filled className="size-4" />}
                  className="size-8 rounded-full bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 ease-out transform-gpu"
                  onClick={handlePrev}
                  disabled={!canScrollPrev}
                />
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.1 }}>
                <YeeButton
                  variant="ghost"
                  icon={<CaretRight24Filled className="size-4" />}
                  className="size-8 rounded-full bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 ease-out transform-gpu"
                  onClick={handleNext}
                  disabled={!canScrollNext}
                />
              </motion.div>
            </>
          )}
          {refresh && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9, rotate: -180 }} transition={{ duration: 0.15 }}>
              <YeeButton
                variant="ghost"
                icon={<ArrowClockwise24Regular className="size-5" />}
                className="size-8 rounded-full bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 ease-out"
              />
            </motion.div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex w-full gap-6 overflow-x-auto scroll-smooth *:shrink-0 [&::-webkit-scrollbar]:hidden"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children}
      </div>
    </motion.section>
  );
}
