import React, { useRef, useEffect, useCallback, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

// ============================================================================
// GLSL Shader 代码
// ============================================================================

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform vec3 u_color4;
  uniform float u_intensity;

  varying vec2 v_uv;

  // Simplex 3D Noise - 用于流体动画
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // FBM (Fractal Brownian Motion) - 多层噪声叠加
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  // 主渲染函数
  void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

    // 动态时间变量
    float t = u_time * 0.15;

    // 多层流体噪声
    vec3 p1 = vec3(uv * 2.0 * aspect, t * 0.5);
    vec3 p2 = vec3(uv * 1.5 * aspect + 0.5, t * 0.3 + 10.0);
    vec3 p3 = vec3(uv * 3.0 * aspect - 0.3, t * 0.7 + 20.0);

    float n1 = fbm(p1) * 0.5 + 0.5;
    float n2 = fbm(p2) * 0.5 + 0.5;
    float n3 = fbm(p3) * 0.5 + 0.5;

    // 颜色混合权重 - 基于噪声
    float w1 = pow(n1, 1.5) * u_intensity;
    float w2 = pow(n2, 1.5) * u_intensity;
    float w3 = pow(n3, 1.5) * u_intensity;

    // 混合所有颜色
    vec3 color = u_color1 * w1 + u_color2 * w2 + u_color3 * w3 + u_color4 * (1.0 - w1 - w2 - w3);

    // 添加高光效果
    float highlight = pow(n1 * n2, 2.0) * 0.3;
    color += vec3(highlight);

    // 边缘柔和
    float vignette = 1.0 - length(uv - 0.5) * 0.5;
    color *= vignette;

    // 略微降低饱和度，增加高级感
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(gray), color, 0.85);

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface FluidGlassmorphismBgProps {
  /** 封面提取的 3-4 个主色，格式为 hex */
  colors?: string[];
  /** 动画强度 0-1 */
  intensity?: number;
  /** 是否暂停渲染（应用失焦时） */
  pauseOnBlur?: boolean;
  className?: string;
}

/**
 * 高性能 WebGL 流体背景组件
 * 
 * 特性：
 * - 基于 Simplex Noise 的流体动画
 * - 自动从封面颜色生成 Uniforms
 * - 应用失焦/最小化时自动暂停渲染
 * - GPU 加速，60 FPS
 */
export const FluidGlassmorphismBg: React.FC<FluidGlassmorphismBgProps> = ({
  colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
  intensity = 0.8,
  pauseOnBlur = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const [isPaused, setIsPaused] = useState(false);

  // 将 hex 颜色转换为 rgb 向量
  const hexToRgb = useCallback((hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ];
    }
    return [0.5, 0.5, 0.5];
  }, []);

  // 初始化 WebGL
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;

    // 编译着色器
    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    // 创建程序
    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // 创建全屏四边形
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  }, []);

  // 设置 Uniforms
  const setupUniforms = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const color1 = hexToRgb(colors[0] || '#6366f1');
    const color2 = hexToRgb(colors[1] || '#8b5cf6');
    const color3 = hexToRgb(colors[2] || '#a855f7');
    const color4 = hexToRgb(colors[3] || '#d946ef');

    gl.uniform3fv(gl.getUniformLocation(program, 'u_color1'), color1);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color2'), color2);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color3'), color3);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color4'), color4);
    gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), intensity);
  }, [colors, intensity, hexToRgb]);

  // 渲染循环
  const render = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas || isPaused) return;

    // 更新时间
    const time = (Date.now() - startTimeRef.current) / 1000;
    gl.uniform1f(gl.getUniformLocation(programRef.current!, 'u_time'), time);

    // 设置分辨率
    gl.uniform2f(
      gl.getUniformLocation(programRef.current!, 'u_resolution'),
      canvas.width,
      canvas.height
    );

    // 清除并绘制
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationRef.current = requestAnimationFrame(render);
  }, [isPaused]);

  // 处理窗口失焦/焦点
  useEffect(() => {
    if (!pauseOnBlur) return;

    let unlistenBlur: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const appWindow = getCurrentWindow();
        
        unlistenBlur = await appWindow.onFocusChanged(({ payload: focused }) => {
          setIsPaused(!focused);
        });
      } catch (e) {
        // 非 Tauri 环境，静默处理
      }
    };

    setupListeners();

    return () => {
      unlistenBlur?.();
    };
  }, [pauseOnBlur]);

  // 初始化和开始渲染
  useEffect(() => {
    initWebGL();
    setupUniforms();
    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [initWebGL, setupUniforms, render]);

  // 更新颜色时重新设置 uniforms
  useEffect(() => {
    setupUniforms();
  }, [colors, intensity, setupUniforms]);

  // 处理 resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{
        willChange: 'contents',
        contain: 'strict',
      }}
    />
  );
};

export default FluidGlassmorphismBg;
