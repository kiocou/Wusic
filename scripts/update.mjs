// scripts/update.mjs
import fetch from "node-fetch";
import { getOctokit, context } from "@actions/github";

// 定义更新标签和文件名，这个标签需要你在仓库中预先创建
const UPDATE_TAG_NAME = "updater";
const UPDATE_FILE_NAME = "update.json";

// 辅助函数：获取签名文件内容
const getSignature = async (url) => {
  const response = await fetch(url);
  return response.text();
};

// 初始化更新数据对象
const updateData = {
  name: "", // 版本号，如 v1.0.0
  pub_date: new Date().toISOString(), // 发布时间
  platforms: {
    // 平台标识符需要与Tauri Updater识别的匹配
    "darwin-x86_64": { signature: "", url: "" },
    "darwin-aarch64": { signature: "", url: "" }, // 针对Apple Silicon Mac
    "linux-x86_64": { signature: "", url: "" },
    "windows-x86_64": { signature: "", url: "" },
  },
};

// 初始化GitHub API客户端
const octokit = getOctokit(process.env.GITHUB_TOKEN);
const { owner, repo } = context.repo;

try {
  // 1. 获取最新的正式发布（由tauri-action创建）
  const { data: latestRelease } = await octokit.rest.repos.getLatestRelease({
    owner,
    repo,
  });
  console.log(`Processing release: ${latestRelease.tag_name}`);
  updateData.name = latestRelease.tag_name;

  // 2. 遍历发布中的资产，匹配并填充更新数据
  for (const asset of latestRelease.assets) {
    const { name, browser_download_url: url } = asset;

    // 匹配macOS Intel .app.tar.gz 包和签名
    if (name.endsWith(".app.tar.gz")) {
      updateData.platforms["darwin-x86_64"].url = url;
    } else if (name.endsWith(".app.tar.gz.sig")) {
      const signature = await getSignature(url);
      updateData.platforms["darwin-x86_64"].signature = signature;
    }
    // 匹配macOS Apple Silicon .app.tar.gz 包和签名 (如果tauri-action生成)
    // 注意：tauri-action可能会为aarch64生成单独包，也可能生成通用包。根据你的实际输出调整。
    else if (name.includes("aarch64") && name.endsWith(".app.tar.gz")) {
      updateData.platforms["darwin-aarch64"].url = url;
    } else if (name.includes("aarch64") && name.endsWith(".app.tar.gz.sig")) {
      const signature = await getSignature(url);
      updateData.platforms["darwin-aarch64"].signature = signature;
    }
    // 匹配Linux .AppImage.tar.gz
    else if (name.endsWith(".AppImage.tar.gz")) {
      updateData.platforms["linux-x86_64"].url = url;
    } else if (name.endsWith(".AppImage.tar.gz.sig")) {
      const signature = await getSignature(url);
      updateData.platforms["linux-x86_64"].signature = signature;
    }
    // 匹配Windows .msi.zip
    else if (name.endsWith(".msi.zip")) {
      updateData.platforms["windows-x86_64"].url = url;
    } else if (name.endsWith(".msi.zip.sig")) {
      const signature = await getSignature(url);
      updateData.platforms["windows-x86_64"].signature = signature;
    }
  }

  // 3. 获取或创建用于存放update.json的“updater”标签发布
  let updaterRelease;
  try {
    const { data } = await octokit.rest.repos.getReleaseByTag({
      owner,
      repo,
      tag: UPDATE_TAG_NAME,
    });
    updaterRelease = data;
    console.log(`Found existing updater release: ${updaterRelease.id}`);
  } catch (error) {
    // 如果找不到，就创建一个新的发布
    if (error.status === 404) {
      const { data } = await octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: UPDATE_TAG_NAME,
        name: "Updater Channel",
        body: "This release contains the auto-generated update manifest.",
        draft: false,
        prerelease: false,
      });
      updaterRelease = data;
      console.log(`Created new updater release: ${updaterRelease.id}`);
    } else {
      throw error;
    }
  }

  // 4. 删除旧的update.json资产（如果存在）
  for (const asset of updaterRelease.assets) {
    if (asset.name === UPDATE_FILE_NAME) {
      await octokit.rest.repos.deleteReleaseAsset({
        owner,
        repo,
        asset_id: asset.id,
      });
      console.log(`Deleted old asset: ${asset.name}`);
      break;
    }
  }

  // 5. 上传新生成的 update.json
  const updateJsonString = JSON.stringify(updateData, null, 2);
  await octokit.rest.repos.uploadReleaseAsset({
    owner,
    repo,
    release_id: updaterRelease.id,
    name: UPDATE_FILE_NAME,
    data: Buffer.from(updateJsonString),
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(updateJsonString),
    },
  });

  console.log(`Successfully uploaded ${UPDATE_FILE_NAME} to updater release.`);
  console.log("Update manifest content:", updateJsonString);
} catch (error) {
  console.error("Failed to generate update manifest:", error);
  process.exit(1);
}
