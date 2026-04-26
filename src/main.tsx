import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSettings } from "./lib/store/settingStore";

// 异步初始化设置 - 不阻塞首屏渲染
// 设置加载完成后会自动应用主题等配置
initSettings().catch(console.error);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
