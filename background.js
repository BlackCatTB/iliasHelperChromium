importScripts("shared/runtime.js", "shared/loginProfiles.js");

const DEFAULT_SETTINGS = {
  autoRefreshOnVisibility: true,
  inactiveThresholdMs: 180000,
};

function sanitizeHost(host) {
  return String(host || "")
    .trim()
    .toLowerCase();
}

async function getState() {
  const data = await ILIASRuntime.storageGet([
    "credentialsByHost",
    "settings",
    "lastActiveHost",
  ]);
  return {
    credentialsByHost: data.credentialsByHost || {},
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
    lastActiveHost: sanitizeHost(data.lastActiveHost),
  };
}

async function saveState(state) {
  await ILIASRuntime.storageSet(state);
}

async function injectContentScripts(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["shared/loginProfiles.js", "content.js"],
  });
}

async function ensureInjectedForTab(tab) {
  if (!tab || !tab.id || !tab.url || !tab.url.startsWith("http")) {
    return false;
  }

  const originPattern = `${new URL(tab.url).origin}/*`;
  const granted = await ILIASRuntime.hasOriginPermission(originPattern);
  if (!granted) {
    return false;
  }

  await injectContentScripts(tab.id);
  return true;
}

async function requestData(host) {
  const requestedHost = sanitizeHost(host);
  const state = await getState();
  const effectiveHost = requestedHost || state.lastActiveHost;
  const credentials = effectiveHost
    ? state.credentialsByHost[effectiveHost] || {}
    : {};

  return {
    host: effectiveHost,
    username: credentials.username || "",
    password: credentials.password || "",
    settings: state.settings,
    profile: effectiveHost ? ILIASProfiles.resolveProfile(effectiveHost) : null,
  };
}

async function saveData(host, data) {
  const normalizedHost = sanitizeHost(host);
  if (!normalizedHost) {
    throw new Error("Host is required to save credentials.");
  }

  const state = await getState();
  state.credentialsByHost[normalizedHost] = {
    username: String(data?.username || "").trim(),
    password: String(data?.password || ""),
  };
  state.lastActiveHost = normalizedHost;

  if (data?.settings) {
    state.settings = {
      ...state.settings,
      ...data.settings,
    };
  }

  await saveState(state);
  return { success: true };
}

async function injectCurrentSite() {
  const tab = await ILIASRuntime.queryActiveTab();
  if (!tab || !tab.url) {
    return { granted: false, reason: "No active tab" };
  }

  const originPattern = `${new URL(tab.url).origin}/*`;
  const granted = await ILIASRuntime.requestOriginPermission(originPattern);
  if (!granted) {
    return { granted: false, reason: "Permission denied" };
  }

  await injectContentScripts(tab.id);
  return { granted: true, originPattern };
}

async function handleLogMeIn() {
  const activeTab = await ILIASRuntime.queryActiveTab();
  if (!activeTab?.id) {
    console.log("[iliasHelper:bg] logMeIn no active tab");
    return { success: false, error: "No active tab" };
  }

  console.log("[iliasHelper:bg] logMeIn sending refresh", {
    tabId: activeTab.id,
    url: activeTab.url,
  });

  const result = await ILIASRuntime.sendMessageToTab(activeTab.id, {
    type: "refresh",
  });

  console.log("[iliasHelper:bg] logMeIn result", result);
  return { success: true, result };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message.action) {
      case "requestData":
        sendResponse(await requestData(message.host));
        return;
      case "saveData":
        sendResponse(await saveData(message.host, message.data));
        return;
      case "logMeIn":
        sendResponse(await handleLogMeIn());
        return;
      case "requestActiveHost":
        {
          const runtimeHost = sanitizeHost(await ILIASRuntime.getActiveHost());
          if (runtimeHost) {
            const state = await getState();
            state.lastActiveHost = runtimeHost;
            await saveState(state);
          }
          const state = await getState();
          sendResponse({ host: runtimeHost || state.lastActiveHost || "" });
        }
        return;
      case "injectCurrentSite":
        sendResponse(await injectCurrentSite());
        return;
      case "openOptions":
        await ILIASRuntime.openOptionsPage();
        sendResponse({ success: true });
        return;
      case "setBadge":
        await ILIASRuntime.setBadge(
          message.text || "",
          message.text === "✔" ? "#0f9d58" : "#d93025",
        );
        sendResponse({ success: true });
        return;
      default:
        sendResponse({ success: false, error: "Unknown action" });
    }
  })().catch((error) => {
    sendResponse({ success: false, error: error.message || String(error) });
  });

  return true;
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") {
    return;
  }

  try {
    await ensureInjectedForTab({ ...tab, id: tabId });
  } catch (_error) {}
});
