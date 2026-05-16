import { getFavicon, rAlert } from "./utils.mjs";
import { getUV, search } from "./prxy.mjs";

const { span, iframe, button, img } = van.tags;
const {
  tags: { "ion-icon": ionIcon },
} = van;

var tabs = [];
var selectedTab = null;

// Side bar
const sideBar = document.querySelector("header");

// Controls
const pageBack = document.getElementById("page-back");
const pageForward = document.getElementById("page-forward");
const pageRefresh = document.getElementById("page-refresh");

// URL Bar
const urlForm = document.getElementById("url-form");
const urlInput = document.getElementById("url-input");

// New Tab Button
const newTabButton = document.getElementById("new-tab");

// Tab List
const tabList = document.getElementById("tab-list");

// Tab View
const tabView = document.getElementById("tab-view");

// Event Listeners
window.onmousemove = (e) => {
  if (e.clientX < 50) {
    sideBar.classList.add("hovered");
  } else {
    sideBar.classList.remove("hovered");
  }
};
pageBack.onclick = () => {
  selectedTab.view.contentWindow.history.back();
};

pageForward.onclick = () => {
  selectedTab.view.contentWindow.history.forward();
};

pageRefresh.onclick = () => {
  selectedTab.view.contentWindow.location.reload();
};

newTabButton.onclick = () => {
  addTab("lite.duckduckgo.com");
};

// Options (opt menu)
const devtoolsOption = document.getElementById("devtools-option");
const abcOption = document.getElementById("abc-option");
const gitOption = document.getElementById("git-option");

devtoolsOption.onclick = () => {
  try {
    // Assuming `selectedTab.view.contentWindow` is your target window
    selectedTab.view.contentWindow.eval(eruda);
    rAlert("Injected successfully.<br>Click the icon on the bottom right.");
  } catch (error) {
    rAlert("Failed to inject.");
  }
};

abcOption.onclick = () => {
  abCloak(selectedTab.view.src);
  rAlert("Opened in about:blank");
};

gitOption.onclick = () => {
  window.open("https://github.com/rhenryw/UV-Static-2.0", "_blank");
};

urlForm.onsubmit = async (e) => {
  e.preventDefault();
  selectedTab.view.src = await getUV(urlInput.value);
};

let eruda = `fetch("https://cdn.jsdelivr.net/npm/eruda")
.then((res) => res.text())
.then((data) => {
  eval(data);
  if (!window.erudaLoaded) {
    eruda.init({ defaults: { displaySize: 45, theme: "AMOLED" } });
    window.erudaLoaded = true;
  }
});`;

function abCloak(cloakUrl) {
  var win = window.open();
  var iframe = win.document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "0px";
  iframe.style.left = "0px";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.src = cloakUrl;
  win.document.body.appendChild(iframe);
}

// Objects
const tabItem = (tab) => {
  return button(
    {
      onclick: (e) => {
        if (
          !e.target.classList.contains("close") &&
          !e.target.classList.contains("close-icon")
        ) {
          focusTab(tab);
        }
      },
      class: "tab-item hover-focus1",
    },
    img({ src: getFavicon(tab.url) }),
    span(tab.title),

    button(
      {
        onclick: () => {
          tabs.splice(tabs.indexOf(tab), 1);

          if (tab == selectedTab) {
            selectedTab = null;
            if (tabs.length) focusTab(tabs[tabs.length - 1]);
            else
              setTimeout(() => {
                addTab("lite.duckduckgo.com");
              }, 100);
          }

          tabView.removeChild(tab.view);
          tab.view.remove();

          localStorage.setItem(
            "tabs",
            JSON.stringify(
              tabs.map((tab) => {
                return tab.url;
              })
            )
          );

          tab.item.style.animation = "slide-out-from-bottom 0.1s ease";
          setTimeout(() => {
            tabList.removeChild(tab.item);
            tab.item.remove();
          }, 75);
        },
        class: "close",
      },
      ionIcon({ name: "close", class: "close-icon" })
    )
  );
};

const tabFrame = (tab) => {
  return iframe({
    class: "tab-frame",
    src: tab.proxiedUrl,
    sandbox: "allow-scripts allow-forms allow-same-origin",
    onload: (e) => {
      let parts = e.target.contentWindow.location.pathname.slice(1).split("/");
      let targetUrl = decodeURIComponent(
        __uv$config.decodeUrl(parts[parts.length - 1])
      );

      tab.title = tab.view.contentWindow.document.title;
      console.log(tab.title);
      tab.url = targetUrl;
      tabList.children[tabs.indexOf(tab)].children[1].textContent = tab.title;
      tabList.children[tabs.indexOf(tab)].children[0].src =
        getFavicon(targetUrl);

      // Update URL bar
      if (tab == selectedTab) {
        urlInput.value = targetUrl;
      }

      localStorage.setItem(
        "tabs",
        JSON.stringify(
          tabs.map((tab) => {
            return tab.url;
          })
        )
      );
    },
  });
};

function focusTab(tab) {
  if (selectedTab) {
    selectedTab.view.style.display = "none";
    tabList.children[tabs.indexOf(selectedTab)].classList.remove("selectedTab");
  }
  selectedTab = tab;
  tab.view.style.display = "block";

  // Update URL bar
  urlInput.value = tab.url;

  tabList.children[tabs.indexOf(tab)].classList.add("selectedTab");
}

async function addTab(link) {
  let url;

  url = await getUV(link);

  let tab = {};

  tab.title = decodeURIComponent(
    __uv$config.decodeUrl(url.substring(url.lastIndexOf("/") + 1))
  ).replace(/^https?:\/\//, "");
  tab.url = search(link);
  tab.proxiedUrl = url;
  tab.icon = null;
  tab.view = tabFrame(tab);
  tab.item = tabItem(tab);

  tab.view.addEventListener("load", () => {
    let links = tab.view.contentWindow.document.querySelectorAll("a");
    links.forEach((element) => {
      element.addEventListener("click", (event) => {
        let isTargetTop = event.target.target === "_top";
        if (isTargetTop) {
          event.preventDefault();
          addTab(event.target.href);
        }
      });
    });
  });

  tabs.push(tab);

  tabList.appendChild(tab.item);

  tabView.appendChild(tab.view);
  focusTab(tab);
}

addTab("lite.duckduckgo.com");

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.has("inject")) {
  let tab = {};
  const injection = urlParams.get("inject");

  setTimeout(() => {
    addTab(injection)
    focusTab()
  }, 100);
}

// Prevent accidental tab closure
window.addEventListener('beforeunload', (event) => {
  if (tabs.length > 0) {
    event.preventDefault();
    event.returnValue = '';
  }
});

// Wisp Server Switcher Logic
const wispServers = [
  { name: "RHW (One)", url: "wss://wisp.rhw.one/", reliability: "Very High", info: "Verified working on your network. Best for games." },
  { name: "Anura (One)", url: "wss://wisp.anura.one/", reliability: "High", info: "Uses the same .one domain. Likely to be unblocked." },
  { name: "Flow (Com)", url: "wss://wisp.flow-wisp.com/", reliability: "High", info: "Optimized for games. Might be blocked by some filters." },
  { name: "Mercury (Workshop)", url: "wss://wisp.mercuryworkshop.me/", reliability: "High", info: "Community-run. Great fallback if available." },
  { name: "Toms (Work)", url: "wss://wisp.toms.work/", reliability: "High", info: "Stable alternative, often blocked on school networks." }
];

async function pingWisp(url, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    const start = Date.now();
    try {
      const socket = new WebSocket(url);
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          socket.close();
          resolve(9999);
        }, 5000);

        socket.onopen = () => {
          const latency = Date.now() - start;
          socket.close();
          clearTimeout(timeout);
          resolve(latency);
        };
        socket.onerror = () => {
          resolve(9999);
        };
      });
      if (result !== 9999) return result;
    } catch (e) {}
  }
  return 9999;
}

function getLatencyIcon(ms) {
  if (ms === 9999) return "wifi_off";
  if (ms < 150) return "signal_wifi_4_bar";
  if (ms < 300) return "network_wifi_3_bar";
  if (ms < 500) return "network_wifi_2_bar";
  return "network_wifi_1_bar";
}

function getLatencyColor(ms) {
  if (ms === 9999) return "#ff4444";
  if (ms < 200) return "#00ff88";
  if (ms < 500) return "#ffbb00";
  return "#ff4444";
}

async function renderWispList() {
  const list = document.getElementById("wisp-list");
  if (!list) return;
  list.innerHTML = "<p style='color:rgba(255,255,255,0.5); font-size:0.8rem;'>Testing servers...</p>";

  const currentWisp = localStorage.getItem("wispUrl") || "wss://wisp.rhw.one/";

  const results = [];
  for (const server of wispServers) {
    const latency = await pingWisp(server.url);
    results.push({ ...server, latency });
  }

  for (const server of results) {
    const icon = getLatencyIcon(server.latency);
    const color = getLatencyColor(server.latency);
    
    const item = document.createElement("div");
    item.className = `wisp-item ${currentWisp === server.url ? 'active' : ''}`;
    item.innerHTML = `
      <div class="wisp-name">${server.name}</div>
      <div class="wisp-status">
        <span class="latency-text">${server.latency === 9999 ? 'Offline' : server.latency + 'ms'}</span>
        <span class="material-symbols-rounded" style="color: ${color}; font-size: 1.2rem;">${icon}</span>
      </div>
      <div class="info-popup">
        <p>${server.info}</p>
        <p class="reliability">Reliability: ${server.reliability}</p>
      </div>
    `;

    item.onclick = async () => {
      // Pre-test before switching
      const listContainer = document.getElementById("wisp-list");
      listContainer.style.opacity = "0.5";
      listContainer.style.pointerEvents = "none";
      
      const latency = await pingWisp(server.url);
      if (latency === 9999) {
        alert("This server is currently blocked by your network. Please try another one!");
        listContainer.style.opacity = "1";
        listContainer.style.pointerEvents = "all";
        return;
      }

      localStorage.setItem("wispUrl", server.url);
      localStorage.setItem("lastWispUrl", server.url);
      window.location.reload();
    };

    list.appendChild(item);
  }
}

const wispInput = document.getElementById("wisp-input");
const wispSave = document.getElementById("wisp-save");
const wispRefresh = document.getElementById("wisp-refresh");
const modeEpoxy = document.getElementById("mode-epoxy");
const modeLibcurl = document.getElementById("mode-libcurl");

if (modeEpoxy && modeLibcurl) {
  const currentMode = localStorage.getItem("transportMode") || "epoxy";
  if (currentMode === "libcurl") {
    modeLibcurl.classList.add("active");
    modeEpoxy.classList.remove("active");
  }

  modeEpoxy.onclick = () => {
    localStorage.setItem("transportMode", "epoxy");
    window.location.reload();
  };

  modeLibcurl.onclick = () => {
    localStorage.setItem("transportMode", "libcurl");
    window.location.reload();
  };
}

if (wispSave) {
  wispSave.onclick = () => {
    let url = wispInput.value.trim();
    if (!url.startsWith("wss://") && !url.startsWith("ws://")) {
      alert("Invalid Wisp URL! Must start with wss:// or ws://");
      return;
    }
    localStorage.setItem("wispUrl", url);
    localStorage.setItem("wispChanged", "true");
    window.location.reload();
  };
}

if (wispRefresh) {
  wispRefresh.onclick = (e) => {
    e.stopPropagation();
    renderWispList();
  };
}

// Initial render
setTimeout(async () => {
  await renderWispList();
  
  // Auto-Picker: If no server is selected, or it's the first visit, pick the fastest
  if (!localStorage.getItem("wispUrl")) {
    const list = document.getElementById("wisp-list");
    const items = Array.from(list.querySelectorAll(".wisp-item"));
    let best = null;
    let minLatency = 9999;

    items.forEach(item => {
      const latText = item.querySelector(".latency-text").innerText;
      const latency = parseInt(latText);
      if (!isNaN(latency) && latency < minLatency) {
        minLatency = latency;
        best = item;
      }
    });

    if (best) {
      best.click();
    }
  }
}, 500);



