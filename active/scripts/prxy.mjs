import { registerSW } from "../prxy/register-sw.mjs";
import * as BareMux from "../prxy/baremux/index.mjs";
import { getFavicon, rAlert } from "./utils.mjs";

const base = location.pathname.includes('/ultraviolet-static-v2/') ? '/ultraviolet-static-v2' : '';
const connection = new BareMux.BareMuxConnection(base + "/active/prxy/baremux/worker.js");

const wispPool = [
  "wss://wisp.rhw.one/",
  "wss://wisp.anura.pro/",
  "wss://ruby.wisp.mercuryworkshop.me/",
  "wss://wisp.starlit.gay/",
  "wss://wisp.voidnet.us/",
  "wss://wisp.flow-wisp.com/",
  "wss://wisp.delusionz.me/"
];

const barePool = [
  "https://tomp.app/",
  "https://bare.benrogo.net/",
  "https://uv.student-corner.net/bare/"
];

async function checkSocket(url) {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => { ws.close(); resolve(false); }, 2500);
      ws.onopen = () => { clearTimeout(timer); ws.close(); resolve(true); };
      ws.onerror = () => { clearTimeout(timer); resolve(false); };
    } catch { resolve(false); }
  });
}

async function checkFetch(url) {
  try {
    const res = await fetch(url, { method: "OPTIONS" });
    return res.ok || res.status === 404 || res.status === 400;
  } catch { return false; }
}

export function search(input, template) {
  try {
    return new URL(input).toString();
  } catch (err) {}

  try {
    const url = new URL(`https://${input}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch (err) {}

  return template.replace("%s", encodeURIComponent(input));
}

export async function getUV(input) {
  try {
    await registerSW();
    rAlert("SW ✓");
  } catch (err) {
    rAlert(`SW failed to register.<br>${err.toString()}`);
    throw err;
  }

  let url = search(input, "https://lite.duckduckgo.com/lite/?q=%s");

  // Storage Resilience Check
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch (e) {
    window.localStorageBackup = window.localStorageBackup || {};
    const originalGet = localStorage.getItem;
    localStorage.getItem = (key) => window.localStorageBackup[key] || originalGet.call(localStorage, key);
    localStorage.setItem = (key, val) => { window.localStorageBackup[key] = val; };
  }

  let transportMode = localStorage.getItem("transportMode") || "epoxy";
  let currentTransport = await connection.getTransport();
  let targetUrl = "";

  if (transportMode === "libcurl") {
    let savedBare = localStorage.getItem("bareUrl") || "https://tomp.app/";
    if (!currentTransport.includes("libcurl") || !(await checkFetch(savedBare))) {
      for (const bare of barePool) {
        if (await checkFetch(bare)) {
          savedBare = bare;
          localStorage.setItem("bareUrl", bare);
          break;
        }
      }
      console.log("[Smart Connect] Setting Stealth Transport (Libcurl) to:", savedBare);
      await connection.setTransport(base + "/active/prxy/libcurl/index.mjs", [{ bare: savedBare }]);
    }
  } else {
    let savedWisp = localStorage.getItem("wispUrl") || "wss://wisp.rhw.one/";
    if (!currentTransport.includes("epoxy") || !(await checkSocket(savedWisp))) {
      console.log(`[Smart Connect] Wisp ${savedWisp} is unresponsive. Finding a working server...`);
      for (const wisp of wispPool) {
        if (await checkSocket(wisp)) {
          savedWisp = wisp;
          localStorage.setItem("wispUrl", wisp);
          break;
        }
      }
      console.log("[Smart Connect] Setting Wisp Transport (Epoxy) to:", savedWisp);
      await connection.setTransport(base + "/active/prxy/epoxy/index.mjs", [{ wisp: savedWisp }]);
    }
  }

  let viewUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
  return viewUrl;
}
