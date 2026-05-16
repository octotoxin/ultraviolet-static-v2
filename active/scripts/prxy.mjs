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
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => { ws.close(); reject(); }, 1500); // Faster timeout
      ws.onopen = () => { clearTimeout(timer); ws.close(); resolve(url); };
      ws.onerror = () => { clearTimeout(timer); reject(); };
    } catch { reject(); }
  });
}

async function checkFetch(url) {
  try {
    const res = await fetch(url, { method: "OPTIONS" });
    if (res.ok || res.status === 404 || res.status === 400) return url;
    throw new Error();
  } catch { throw new Error(); }
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
  } catch (err) {
    rAlert(`SW failed to register.<br>${err.toString()}`);
    throw err;
  }

  let url = search(input, "https://lite.duckduckgo.com/lite/?q=%s");

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

  if (transportMode === "libcurl") {
    let savedBare = localStorage.getItem("bareUrl") || "https://tomp.app/";
    // Test current bare, if fails, race all others in parallel
    try {
      await checkFetch(savedBare);
    } catch {
      try {
        console.log("[Smart Connect] Testing all Bare servers instantly...");
        savedBare = await Promise.any(barePool.map(checkFetch));
        localStorage.setItem("bareUrl", savedBare);
      } catch {
        savedBare = barePool[0]; // Fallback to default if all blocked
      }
    }
    
    if (!currentTransport.includes("libcurl") || currentTransport !== savedBare) {
      console.log("[Smart Connect] Stealth Transport Ready:", savedBare);
      await connection.setTransport(base + "/active/prxy/libcurl/index.mjs", [{ bare: savedBare }]);
    }
  } else {
    let savedWisp = localStorage.getItem("wispUrl") || "wss://wisp.rhw.one/";
    try {
      await checkSocket(savedWisp);
    } catch {
      try {
        console.log("[Smart Connect] Testing all Wisp servers instantly...");
        savedWisp = await Promise.any(wispPool.map(checkSocket));
        localStorage.setItem("wispUrl", savedWisp);
      } catch {
        savedWisp = wispPool[0];
      }
    }

    if (!currentTransport.includes("epoxy") || currentTransport !== savedWisp) {
      console.log("[Smart Connect] Wisp Transport Ready:", savedWisp);
      await connection.setTransport(base + "/active/prxy/epoxy/index.mjs", [{ wisp: savedWisp }]);
    }
  }

  let viewUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
  return viewUrl;
}
