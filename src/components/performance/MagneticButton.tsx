import React, { useRef, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ============================================================================
// 磁吸按钮配置
// ============================================================================

interface MagneticButtonProps {
  children: React.ReactNode;
  /** 磁吸强度 (0-1)，默认 0.3 */
  strength?: number;
  /** 回弹的弹簧 stiffness，默认 150 */
  stiffness?: number;
  /** 回弹的阻尼 damping，默认 15 */
  damping?: number;
  /** 鼠标点击时的缩放 */
  tapScale?: number;
  /** 点击时的回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 点击时背景模糊闪烁的强度 */
  blurIntensity?: number;
}

/**
 * 磁吸按钮组件 (Magnetic Button)
 * 
 * 特性：
 * - 鼠标靠近时，按钮带有物理阻尼地被"吸附"向鼠标方向
 * - 使用 Framer Motion 的 useSpring 实现平滑回弹
 * - 点击时有触觉反馈模拟（背景微闪烁）
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.3,
  stiffness = 150,
  damping = 15,
  tapScale = 0.92,
  onClick,
  className = '',
  disabled = false,
  blurIntensity = 0.02,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // 鼠标位置 (相对于按钮中心)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 使用 spring 让磁吸效果更平滑
  const springConfig = { stiffness, damping };
  
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // 缩放 transform
  const scale = useTransform(
    [x, y],
    ([latestX, latestY]) => {
      const distance = Math.sqrt(Number(latestX) ** 2 + Number(latestY) ** 2);
      const maxDistance = 100;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      return 1 + normalizedDistance * strength * 0.2;
    }
  );

  // 点击时的缩放动画
  const tapScaleValue = useMotionValue(1);

  // 背景模糊闪烁 (通过 CSS 变量控制)
  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    setIsHovered(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  }, [disabled, mouseX, mouseY]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // 计算鼠标相对于中心的偏移
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      mouseX.set(deltaX);
      mouseY.set(deltaY);
    },
    [disabled, strength, mouseX, mouseY]
  );

  const handleMouseDown = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);
    tapScaleValue.set(tapScale);
  }, [disabled, tapScale, tapScaleValue]);

  const handleMouseUp = useCallback(() => {
    if (disabled) return;
    setIsPressed(false);
    tapScaleValue.set(1);
  }, [disabled, tapScaleValue]);

  return (
    <motion.div
      ref={buttonRef}
      className={`relative cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={{
        x,
        y,
        scale,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={disabled ? undefined : onClick}
      whileTap={{ scale: tapScale }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
      {/* 触觉反馈层 - 点击时的模糊闪烁 */}
      <motion.div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        animate={{
          opacity: isPressed ? blurIntensity : 0,
          scale: isPressed ? 1.05 : 1,
        }}
        transition={{ duration: 0.1 }}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      />

      {/* 按钮内容 */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// ============================================================================
// 弹性阻尼列表包装器 (Rubber-band Effect)
// ============================================================================

interface RubberBandListProps {
  children: React.ReactNode;
  className?: string;
  /** 弹性系数，越大弹性越强 */
  rubberBandFactor?: number;
  /** 边界阈值 */
  boundaryThreshold?: number;
}

export const RubberBandList: React.FC<RubberBandListProps> = ({
  children,
  className = '',
  rubberBandFactor = 0.2,
}) => {
  const [offset, setOffset] = useState(0);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY;
    
    if (Math.abs(offset) > 0) {
      // 接近边界时的弹性效果
      const overscroll = Math.abs(delta) * rubberBandFactor;
      setOffset((prev) => prev + (delta > 0 ? overscroll : -overscroll));
      
      // 延迟回弹
      setTimeout(() => setOffset(0), 150);
    }
  }, [offset, rubberBandFactor]);

  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      style={{
        y: offset,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      onWheel={handleWheel}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// 触觉反馈 Hook
// ============================================================================

interface UseHapticFeedbackOptions {
  /** 模糊闪烁强度 */
  blurIntensity?: number;
  /** 动画持续时间 */
  duration?: number;
}

/**
 * 触觉反馈 Hook
 * 用于在点击时产生背景模糊闪烁效果
 */
export function useHapticFeedback(options: UseHapticFeedbackOptions = {}) {
  const { blurIntensity = 0.02, duration = 150 } = options;
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), duration);
  }, [duration]);

  const style: React.CSSProperties = {
    opacity: isActive ? blurIntensity : 0,
    transition: `opacity ${duration}ms ease-out`,
  };

  return { isActive, trigger, style };
}

export default MagneticButton;
