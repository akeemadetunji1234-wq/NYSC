import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const port = 9223;
const width = 375;
const height = 812;
const baseUrl = process.env.PHONE_SMOKE_BASE_URL || process.env.BASE_URL || "http://localhost:3000";
const routes = ["/", "/signin", "/signup", "/member", "/agent", "/admin", "/member/profile", "/agent/settings", "/admin/profile"];
const outputDir = process.env.PHONE_SMOKE_OUTPUT ?? "/tmp/nysc-phone-smoke";

await mkdir(outputDir, { recursive: true });
const browser = spawn("chromium", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${port}`,
  "--remote-allow-origins=*",
  `--user-data-dir=/tmp/nysc-mobile-browser-${process.pid}`,
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let websocket;
let nextId = 0;
const pending = new Map();

try {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (!page) throw new Error("Chromium page target not ready");
      websocket = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((resolve, reject) => {
        websocket.addEventListener("open", resolve, { once: true });
        websocket.addEventListener("error", reject, { once: true });
      });
      break;
    } catch {
      await sleep(200);
    }
  }
  if (!websocket) throw new Error("Unable to connect to Chromium DevTools");

  websocket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    websocket.send(JSON.stringify({ id, method, params }));
  });

  await command("Page.enable");
  await command("Runtime.enable");
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: true,
  });

  await command("Page.navigate", { url: `${baseUrl}/` });
  await sleep(1800);
  await command("Runtime.evaluate", {
    expression: "localStorage.setItem('theme', 'dark')",
  });
  await command("Page.reload");
  await sleep(1800);
  const authRoutes = ["/signin", "/signup", "/forgot-password", "/reset-password", "/verify-google"];
  const authThemes = [];
  for (const route of authRoutes) {
    if (route === "/signin") {
      const clicked = await command("Runtime.evaluate", {
        expression: "(() => { const link = document.querySelector('a[href=\"/signin\"]'); link?.click(); return Boolean(link); })()",
        returnByValue: true,
      });
      if (!clicked.result.value) throw new Error("Homepage Sign In link was not found");
    } else {
      await command("Page.navigate", { url: `${baseUrl}${route}` });
    }
    let authTheme;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await sleep(300);
      authTheme = await command("Runtime.evaluate", {
      expression: `(() => {
        const surface = document.querySelector('[data-auth-surface]');
        const input = surface?.querySelector('input');
        const surfaceBackground = surface ? getComputedStyle(surface).backgroundColor : null;
        const inputBackground = input ? getComputedStyle(input).backgroundColor : null;
        const surfaceCard = surface ? getComputedStyle(surface).getPropertyValue('--card').trim() : null;
        return {
          route: ${JSON.stringify(route)},
          href: location.href,
          surfaceBackground,
          inputBackground,
          surfaceCard,
          light: Boolean(surface && surfaceBackground && surfaceCard && (!input || ['transparent', 'rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)'].includes(inputBackground))),
        };
      })()`,
        returnByValue: true,
      });
      const candidate = authTheme.result.value;
      if (candidate?.surfaceBackground && candidate?.surfaceCard) break;
    }
    const result = authTheme.result.value;
    if (!result?.light) {
      throw new Error(`Auth light-mode regression: ${JSON.stringify(result)}`);
    }
    authThemes.push(result);
  }

  const results = [];
  for (const route of routes) {
    await command("Page.navigate", { url: `${baseUrl}${route}` });
    await sleep(1800);
    const metrics = await command("Runtime.evaluate", {
      expression: `({
        href: location.href,
        readyState: document.readyState,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body?.scrollWidth ?? null,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      })`,
      returnByValue: true,
    });
    const screenshot = await command("Page.captureScreenshot", { format: "png" });
    const fileName = `${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}-375-cdp.png`;
    await writeFile(`${outputDir}/${fileName}`, Buffer.from(screenshot.data, "base64"));
    results.push({ route, ...metrics.result.value, screenshot: `${outputDir}/${fileName}` });
  }

  console.log(JSON.stringify({ viewport: { width, height }, authThemes, routes: results }, null, 2));
} finally {
  websocket?.close();
  browser.kill("SIGTERM");
}
