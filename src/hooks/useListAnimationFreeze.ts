import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 列表渲染冻结 Hook
 * 
 * 功能：
 * - 在大型过渡动画期间冻结后台复杂列表的渲染
 * - 动画结束后自动恢复
 * 
 * @param listItems - 列表数据
 * @param freezeKey - 触发冻结的状态键
 * @param unfreezeDelay - 动画结束后的延迟恢复时间 (ms)
 */
export function useListAnimationFreeze<T>(
  listItems: T[],
  freezeKey: string | null,
  unfreezeDelay: number = 300
) {
  const [isFrozen, setIsFrozen] = useState(false);
  const [displayItems, setDisplayItems] = useState<T[]>(listItems);
  const freezeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unfreezeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 监听 freezeKey 变化
  useEffect(() => {
    if (freezeKey) {
      // 开始冻结
      setIsFrozen(true);
      
      // 清除可能存在的恢复定时器
      if (unfreezeTimeoutRef.current) {
        clearTimeout(unfreezeTimeoutRef.current);
      }
    } else {
      // 开始恢复
      unfreezeTimeoutRef.current = setTimeout(() => {
        setIsFrozen(false);
        setDisplayItems(listItems);
      }, unfreezeDelay);
    }

    return () => {
      if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
      if (unfreezeTimeoutRef.current) clearTimeout(unfreezeTimeoutRef.current);
    };
  }, [freezeKey, listItems, unfreezeDelay]);

  // 性能优化：冻结时返回缓存的列表
  return {
    items: isFrozen ? displayItems : listItems,
    isFrozen,
  };
}

/**
 * 帧率感知调度 Hook
 * 根据当前帧率自动调整动画复杂度
 */
export function useAdaptiveAnimation() {
  const [fps, setFps] = useState(60);
  const [complexity, setComplexity] = useState<'high' | 'medium' | 'low'>('high');
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number>(0);

  const measureFps = useCallback(() => {
    frameCountRef.current++;
    const now = performance.now();
    const delta = now - lastTimeRef.current;

    if (delta >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / delta);
      setFps(currentFps);
      
      // 根据 FPS 调整复杂度
      if (currentFps >= 55) {
        setComplexity('high');
      } else if (currentFps >= 40) {
        setComplexity('medium');
      } else {
        setComplexity('low');
      }

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(measureFps);
  }, []);

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(measureFps);
    
    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [measureFps]);

  return { fps, complexity };
}

export default useListAnimationFreeze;
