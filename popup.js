(function () {
  const hostLabel = document.getElementById("hostLabel");
  const status = document.getElementById("status");
  const form = document.getElementById("credentialsForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const autoRefreshCheckbox = document.getElementById(
    "autoRefreshOnVisibility",
  );
  const overlay = document.getElementById("loading-overlay");

  let activeHost = "";

  function setStatus(message) {
    status.textContent = message;
  }

  function showLoadingOverlay() {
    overlay.classList.remove("hidden");
  }

  function hideLoadingOverlay() {
    overlay.classList.add("hidden");
  }

  async function resolveActiveHost() {
    const hostResponse = await ILIASRuntime.sendMessage({
      action: "requestActiveHost",
    });

    let host = String(hostResponse?.host || "")
      .trim()
      .toLowerCase();

    if (host) {
      return host;
    }

    const activeTab = await ILIASRuntime.queryActiveTab();
    host = ILIASRuntime.getHostFromUrl(activeTab?.url || "");
    return String(host || "")
      .trim()
      .toLowerCase();
  }

  async function loadData() {
    showLoadingOverlay();

    try {
      activeHost = await resolveActiveHost();
      hostLabel.textContent = activeHost
        ? `Host: ${activeHost}`
        : "Open an ILIAS tab first";

      if (!activeHost) {
        setStatus("No active host available yet.");
        return;
      }

      const data = await ILIASRuntime.sendMessage({
        action: "requestData",
        host: activeHost,
      });
      usernameInput.value = data.username || "";
      passwordInput.value = data.password || "";
      autoRefreshCheckbox.checked = Boolean(
        data.settings?.autoRefreshOnVisibility,
      );

      const profile = ILIASProfiles.resolveProfile(activeHost);
      setStatus(`Profile: ${profile.id}`);
    } finally {
      hideLoadingOverlay();
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!activeHost) {
      setStatus("Open an ILIAS tab first.");
      return;
    }

    await ILIASRuntime.sendMessage({
      action: "saveData",
      host: activeHost,
      data: {
        username: usernameInput.value,
        password: passwordInput.value,
        settings: {
          autoRefreshOnVisibility: autoRefreshCheckbox.checked,
        },
      },
    });

    setStatus("Saved.");
  });

  document
    .getElementById("logMeInButton")
    .addEventListener("click", async () => {
      const response = await ILIASRuntime.sendMessage({ action: "logMeIn" });
      if (response?.success) {
        setStatus("Login refresh completed.");
      } else {
        setStatus(response?.error || "Login refresh failed.");
      }

      console.log("[iliasHelper:popup] logMeIn response", response);
    });

  document
    .getElementById("enableSiteButton")
    .addEventListener("click", async () => {
      const response = await ILIASRuntime.sendMessage({
        action: "injectCurrentSite",
      });
      if (response.granted) {
        setStatus("Site enabled.");
      } else {
        setStatus(response.reason || "Permission denied.");
      }
    });

  document
    .getElementById("openOptionsButton")
    .addEventListener("click", async () => {
      await ILIASRuntime.sendMessage({ action: "openOptions" });
    });

  loadData().catch((error) => {
    hideLoadingOverlay();
    setStatus(error.message || "Failed to load data");
  });
})();
