import { Vibrant } from "node-vibrant/browser";

// 颜色提取结果缓存
const colorCache: Record<string, { light: string; dark: string }> = {};

/**
 * 从图片中提取颜色
 * @param url 图片URL
 * @returns 提取的颜色对象
 */
export const extractColorFromImage = async (url: string): Promise<{ light: string; dark: string }> => {
  // 检查缓存
  if (colorCache[url]) {
    return colorCache[url];
  }

  return new Promise((resolve) => {
    // 使用setTimeout异步处理，避免阻塞主线程
    setTimeout(() => {
      const v = new Vibrant(url);
      v.getPalette().then((palette) => {
        const colors = {
          light: palette.LightVibrant?.hex || "transparent",
          dark: palette.DarkMuted?.hex || "transparent"
        };
        // 缓存结果
        colorCache[url] = colors;
        resolve(colors);
      }).catch(() => {
        // 失败时返回默认值
        const defaultColors = { light: "transparent", dark: "transparent" };
        colorCache[url] = defaultColors;
        resolve(defaultColors);
      });
    }, 0);
  });
};

/**
 * 清除颜色缓存
 */
export const clearColorCache = () => {
  Object.keys(colorCache).forEach(key => delete colorCache[key]);
};
