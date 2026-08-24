import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const port = 9223;
const width = 375;
const height = 812;
const baseUrl = "http://127.0.0.1:3000";
const routes = ["/", "/signin", "/signup", "/member", "/agent", "/admin"];
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

  console.log(JSON.stringify({ viewport: { width, height }, routes: results }, null, 2));
} finally {
  websocket?.close();
  browser.kill("SIGTERM");
}
