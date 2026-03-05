(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;

  function callWithCallback(fn) {
    return new Promise((resolve, reject) => {
      try {
        fn((result) => {
          const lastError = api.runtime && api.runtime.lastError;
          if (lastError) {
            reject(new Error(lastError.message));
            return;
          }
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async function sendMessage(message) {
    if (typeof browser !== "undefined") {
      return browser.runtime.sendMessage(message);
    }
    return callWithCallback((done) => api.runtime.sendMessage(message, done));
  }

  async function storageGet(keys) {
    if (typeof browser !== "undefined") {
      return browser.storage.local.get(keys);
    }
    return callWithCallback((done) => api.storage.local.get(keys, done));
  }

  async function storageSet(data) {
    if (typeof browser !== "undefined") {
      await browser.storage.local.set(data);
      return;
    }
    await callWithCallback((done) => api.storage.local.set(data, done));
  }

  async function queryActiveTab() {
    if (!api.tabs || !api.tabs.query) {
      return null;
    }

    const queryCandidates = [
      { active: true, currentWindow: true },
      { active: true, lastFocusedWindow: true },
      { active: true },
    ];

    for (const query of queryCandidates) {
      try {
        if (typeof browser !== "undefined") {
          const tabs = await browser.tabs.query(query);
          if (tabs && tabs.length > 0) {
            return tabs[0];
          }
          continue;
        }

        const tabs = await callWithCallback((done) =>
          api.tabs.query(query, done),
        );
        if (tabs && tabs.length > 0) {
          return tabs[0];
        }
      } catch (_error) {}
    }

    return null;
  }

  async function sendMessageToTab(tabId, message) {
    if (
      tabId === undefined ||
      tabId === null ||
      !api.tabs ||
      !api.tabs.sendMessage
    ) {
      return null;
    }

    if (typeof browser !== "undefined") {
      return browser.tabs.sendMessage(tabId, message);
    }

    return callWithCallback((done) =>
      api.tabs.sendMessage(tabId, message, done),
    );
  }

  async function sendMessageToActiveTab(message) {
    const activeTab = await queryActiveTab();
    if (!activeTab) {
      return null;
    }
    return sendMessageToTab(activeTab.id, message);
  }

  async function openOptionsPage() {
    if (api.runtime && api.runtime.openOptionsPage) {
      if (typeof browser !== "undefined") {
        return api.runtime.openOptionsPage();
      }
      return callWithCallback((done) => api.runtime.openOptionsPage(done));
    }

    if (api.tabs && api.tabs.create) {
      const url = api.runtime.getURL("options.html");
      if (typeof browser !== "undefined") {
        return api.tabs.create({ url });
      }
      return callWithCallback((done) => api.tabs.create({ url }, done));
    }

    return null;
  }

  function getHostFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch (_error) {
      return "";
    }
  }

  async function getActiveHost() {
    const activeTab = await queryActiveTab();
    return activeTab && activeTab.url ? getHostFromUrl(activeTab.url) : "";
  }

  async function setBadge(text, color) {
    if (!api.action || !api.action.setBadgeText) {
      return;
    }

    if (typeof browser !== "undefined") {
      await api.action.setBadgeText({ text });
      if (api.action.setBadgeBackgroundColor && color) {
        await api.action.setBadgeBackgroundColor({ color });
      }
      return;
    }

    await callWithCallback((done) => api.action.setBadgeText({ text }, done));
    if (api.action.setBadgeBackgroundColor && color) {
      await callWithCallback((done) =>
        api.action.setBadgeBackgroundColor({ color }, done),
      );
    }
  }

  async function requestOriginPermission(originPattern) {
    if (!api.permissions || !api.permissions.request) {
      return true;
    }

    if (typeof browser !== "undefined") {
      return api.permissions.request({ origins: [originPattern] });
    }

    return callWithCallback((done) =>
      api.permissions.request({ origins: [originPattern] }, done),
    );
  }

  async function hasOriginPermission(originPattern) {
    if (!api.permissions || !api.permissions.contains) {
      return true;
    }

    if (typeof browser !== "undefined") {
      return api.permissions.contains({ origins: [originPattern] });
    }

    return callWithCallback((done) =>
      api.permissions.contains({ origins: [originPattern] }, done),
    );
  }

  globalThis.ILIASRuntime = {
    api,
    sendMessage,
    storageGet,
    storageSet,
    queryActiveTab,
    sendMessageToTab,
    sendMessageToActiveTab,
    openOptionsPage,
    getHostFromUrl,
    getActiveHost,
    setBadge,
    requestOriginPermission,
    hasOriginPermission,
  };
})();
