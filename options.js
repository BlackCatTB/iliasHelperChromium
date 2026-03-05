(function () {
  const form = document.getElementById("optionsForm");
  const hostInput = document.getElementById("host");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const autoRefreshCheckbox = document.getElementById(
    "autoRefreshOnVisibility",
  );
  const status = document.getElementById("status");

  function setStatus(message) {
    status.textContent = message;
  }

  function normalizeHost(host) {
    return String(host || "")
      .trim()
      .toLowerCase();
  }

  async function resolveHost() {
    const activeHostResponse = await ILIASRuntime.sendMessage({
      action: "requestActiveHost",
    });
    let host = normalizeHost(activeHostResponse?.host);
    if (host) {
      return host;
    }

    const activeTab = await ILIASRuntime.queryActiveTab();
    host = normalizeHost(ILIASRuntime.getHostFromUrl(activeTab?.url || ""));
    return host;
  }

  async function loadInitialData() {
    const host = await resolveHost();
    if (host) {
      hostInput.value = host;
    }

    const data = await ILIASRuntime.sendMessage({
      action: "requestData",
      host,
    });
    const effectiveHost = normalizeHost(data.host || host);
    if (effectiveHost) {
      hostInput.value = effectiveHost;
    }
    usernameInput.value = data.username || "";
    passwordInput.value = data.password || "";
    autoRefreshCheckbox.checked = Boolean(
      data.settings?.autoRefreshOnVisibility,
    );
    setStatus(
      effectiveHost
        ? `Editing ${effectiveHost}`
        : "Enter a host to store credentials",
    );

    console.log("[iliasHelper:options] loaded data", {
      host: effectiveHost,
      hasUsername: Boolean(data.username),
      hasPassword: Boolean(data.password),
    });
  }

  hostInput.addEventListener("change", async () => {
    const host = normalizeHost(hostInput.value);
    if (!host) {
      usernameInput.value = "";
      passwordInput.value = "";
      setStatus("Enter a host to store credentials");
      return;
    }

    const data = await ILIASRuntime.sendMessage({
      action: "requestData",
      host,
    });
    usernameInput.value = data.username || "";
    passwordInput.value = data.password || "";
    const profile = ILIASProfiles.resolveProfile(host);
    setStatus(`Profile: ${profile.id}`);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const host = normalizeHost(hostInput.value);
    if (!host) {
      setStatus("Host is required.");
      return;
    }

    await ILIASRuntime.sendMessage({
      action: "saveData",
      host,
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

  loadInitialData().catch((error) => {
    setStatus(error.message || "Unable to load settings");
  });
})();
