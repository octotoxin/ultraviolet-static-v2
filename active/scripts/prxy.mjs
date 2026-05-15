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
    const url = new URL(`http://${input}`);
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

  let wispUrl = localStorage.getItem("wispUrl") || "wss://wisp.mercury.cf/";
  
  if ((await connection.getTransport()) !== base + "/active/prxy/epoxy/index.mjs" || localStorage.getItem("wispChanged")) {
    localStorage.removeItem("wispChanged");
    await connection.setTransport(base + "/active/prxy/epoxy/index.mjs", [
      { wisp: wispUrl },
    ]);
  }
  if ((await connection.getTransport()) !== base + "/active/prxy/libcurl/libcurl.mjs") {
    await connection.setTransport(base + "/active/prxy/libcurl/libcurl.mjs", [
      { wisp: wispUrl },
    ]);
  }

  let viewUrl = __uv$config.prefix + __uv$config.encodeUrl(url);

  return viewUrl;
}
