(function () {
  if (window.__ILIAS_HELPER_LOADED__) {
    return;
  }
  window.__ILIAS_HELPER_LOADED__ = true;

  const host = window.location.hostname;
  let hiddenAt = Date.now();

  function sendRuntimeMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }

  function showOverlay() {
    if (document.getElementById("ilias-helper-overlay")) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "ilias-helper-overlay";
    overlay.innerHTML = `
      <div class="ilias-helper-overlay-content">
        <p>ILIAS Helper<br>Refreshing session...</p>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #ilias-helper-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.45);
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .ilias-helper-overlay-content {
        background: rgba(0, 0, 0, 0.75);
        padding: 16px 20px;
        border-radius: 10px;
        font-size: 16px;
        text-align: center;
      }
    `;

    overlay.appendChild(style);
    document.documentElement.appendChild(overlay);
  }

  function hideOverlay() {
    const overlay = document.getElementById("ilias-helper-overlay");
    if (overlay) {
      overlay.remove();
    }
  }

  async function loginToILIAS(reason) {
    const data = await sendRuntimeMessage({ action: "requestData", host });
    const username = String(data?.username || "").trim();
    const password = String(data?.password || "");

    if (!username || !password) {
      return { ok: false, skipped: true, reason: "missing_credentials" };
    }

    const profile = ILIASProfiles.resolveProfile(host);

    if (reason === "visibility" && !data.settings?.autoRefreshOnVisibility) {
      return { ok: false, skipped: true, reason: "disabled" };
    }

    const formData = new FormData();
    formData.append(profile.usernameField, username);
    formData.append(profile.passwordField, password);

    Object.entries(profile.extraFields || {}).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (reason !== "initial") {
      showOverlay();
    }

    try {
      const response = await fetch(profile.loginUrl, {
        method: "POST",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...(profile.headers || {}),
        },
        body: formData,
        credentials: "include",
      });

      await sendRuntimeMessage({
        action: "setBadge",
        text: response.ok ? "✔" : "✘",
      });

      const shouldRedirect =
        response.ok &&
        reason === "initial" &&
        ILIASProfiles.shouldRedirectAfterLogin(window.location.href);

      console.log("[iliasHelper:content] redirect decision", {
        host,
        reason,
        shouldRedirect,
        currentUrl: window.location.href,
      });

      if (shouldRedirect) {
        window.location.href = "/";
      }

      return { ok: response.ok, status: response.status };
    } finally {
      hideOverlay();
    }
  }

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type !== "refresh") {
      return false;
    }

    loginToILIAS("manual")
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({ ok: false, error: error.message || String(error) }),
      );

    return true;
  });

  if (!sessionStorage.getItem("ilias-helper-initial-refresh")) {
    sessionStorage.setItem("ilias-helper-initial-refresh", "1");
    loginToILIAS("initial").catch(() => {});
  }

  document.addEventListener("visibilitychange", async () => {
    const data = await sendRuntimeMessage({ action: "requestData", host });
    const threshold = Number(data.settings?.inactiveThresholdMs || 180000);

    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
      return;
    }

    const inactiveTime = Date.now() - hiddenAt;
    if (inactiveTime >= threshold) {
      loginToILIAS("visibility").catch(() => {});
    }
  });
})();
