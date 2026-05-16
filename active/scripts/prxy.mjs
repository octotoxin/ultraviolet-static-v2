import { registerSW } from "../prxy/register-sw.mjs";
import * as BareMux from "../prxy/baremux/index.mjs";
import { getFavicon, rAlert } from "./utils.mjs";

const base = location.pathname.includes('/ultraviolet-static-v2/') ? '/ultraviolet-static-v2' : '';
const connection = new BareMux.BareMuxConnection(base + "/active/prxy/baremux/worker.js");

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
    console.warn("Storage blocked by Tracking Prevention. Using memory-only mode.");
    window.localStorageBackup = {};
    const originalGet = localStorage.getItem;
    localStorage.getItem = (key) => window.localStorageBackup[key] || originalGet.call(localStorage, key);
    localStorage.setItem = (key, val) => { window.localStorageBackup[key] = val; };
  }

  let wispUrl = localStorage.getItem("wispUrl") || "wss://wisp.rhw.one/";
  let transportMode = localStorage.getItem("transportMode") || "epoxy";
  let lastWisp = localStorage.getItem("lastWispUrl");
  let lastMode = localStorage.getItem("lastTransportMode");
  
  const currentTransport = await connection.getTransport();
  
  if (wispUrl !== lastWisp || transportMode !== lastMode || !currentTransport.includes(transportMode)) {
    localStorage.setItem("lastWispUrl", wispUrl);
    localStorage.setItem("lastTransportMode", transportMode);
    
    if (transportMode === "libcurl") {
      const bareUrl = wispUrl.replace("wss://", "https://").replace("ws://", "http://");
      console.log("Setting Stealth Transport (Libcurl) to:", bareUrl);
      await connection.setTransport(base + "/active/prxy/libcurl/index.mjs", [{ bare: bareUrl }]);
    } else {
      console.log("Setting Wisp Transport (Epoxy) to:", wispUrl);
      await connection.setTransport(base + "/active/prxy/epoxy/index.mjs", [{ wisp: wispUrl }]);
    }
  }


  let viewUrl = __uv$config.prefix + __uv$config.encodeUrl(url);

  return viewUrl;
}
