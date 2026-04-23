import { useCallback, useRef, useEffect } from 'react';

interface HardwareAccelerationOptions {
  /** 动画持续时间，结束后移除 will-change (默认 300ms) */
  cleanupDelay?: number;
  /** 交互触发时的 will-change 值 */
  willChangeProperty?: 'transform' | 'opacity' | 'filter';
}

/**
 * 动态 GPU 硬件加速 Hook
 * 
 * 功能：
 * - 鼠标悬停时动态添加 will-change 和 transform-gpu
 * - 交互结束后自动移除，防止 VRAM 溢出
 * - 支持多种 will-change 属性
 * 
 * @example
 * const { onMouseEnter, onMouseLeave, ref } = useHardwareAcceleration();
 * <button ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>播放</button>
 */
export function useHardwareAcceleration(options: HardwareAccelerationOptions = {}) {
  const { cleanupDelay = 300, willChangeProperty = 'transform' } = options;
  
  const elementRef = useRef<HTMLElement>(null);
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    // 清除可能存在的定时器
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // 强制浏览器为即将发生的动画分配 GPU 资源
    element.style.willChange = willChangeProperty;
    element.style.transform = 'translateZ(0)'; // 强制创建 GPU 层
  }, [willChangeProperty]);

  const onMouseLeave = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    // 延迟移除，让动画有缓冲时间
    cleanupTimeoutRef.current = setTimeout(() => {
      if (element) {
        element.style.willChange = 'auto';
        element.style.transform = 'translateZ(0)'; // 保持 GPU 层但允许合并
      }
    }, cleanupDelay);
  }, [cleanupDelay]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, []);

  return {
    ref: elementRef,
    onMouseEnter,
    onMouseLeave,
  };
}

/**
 * 批量硬件加速 Hook - 适用于列表项
 */
export function useBatchHardwareAcceleration(
  itemCount: number,
  options: HardwareAccelerationOptions = {}
) {
  const { cleanupDelay = 300, willChangeProperty = 'transform' } = options;
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const cleanupTimeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // 初始化 refs 数组
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, itemCount);
  }, [itemCount]);

  const getItemHandlers = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
      onMouseEnter: () => {
        const element = itemRefs.current[index];
        if (!element) return;

        // 清除定时器
        const existingTimeout = cleanupTimeouts.current.get(index);
        if (existingTimeout) clearTimeout(existingTimeout);

        element.style.willChange = willChangeProperty;
        element.style.transform = 'translateZ(0)';
      },
      onMouseLeave: () => {
        const element = itemRefs.current[index];
        if (!element) return;

        const timeout = setTimeout(() => {
          if (element) {
            element.style.willChange = 'auto';
          }
        }, cleanupDelay);

        cleanupTimeouts.current.set(index, timeout);
      },
    }),
    [willChangeProperty, cleanupDelay]
  );

  // 清理所有定时器
  useEffect(() => {
    return () => {
      cleanupTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      cleanupTimeouts.current.clear();
    };
  }, []);

  return { getItemHandlers };
}

/**
 * 性能监视 Hook - 追踪动画帧率
 */
export function usePerformanceMonitor() {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fps = useRef(60);

  const measure = useCallback(() => {
    frameCount.current++;
    const currentTime = performance.now();
    const delta = currentTime - lastTime.current;

    if (delta >= 1000) {
      fps.current = Math.round((frameCount.current * 1000) / delta);
      frameCount.current = 0;
      lastTime.current = currentTime;
      
      // FPS 过低时发出警告
      if (fps.current < 45) {
        console.warn(`[Performance] FPS dropped to ${fps.current}`);
      }
    }
  }, []);

  const startMeasuring = useCallback(() => {
    const loop = () => {
      measure();
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [measure]);

  return { fps: fps.current, startMeasuring };
}
