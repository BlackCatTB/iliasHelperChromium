chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);

  if (request.type === "refresh") loginToILIAS();
});

const KNOWN_LOGIN_SITES = {
  "ilias3.uni-stuttgart.de": {
    method: "form",
    loginUrl:
      "https://ilias3.uni-stuttgart.de/ilias.php?baseClass=ilstartupgui&cmd=post&fallbackCmd=doStandardAuthentication&lang=de&client_id=Uni_Stuttgart",
    default_landing_url: "",
    usernameField: "login_form/input_3/input_4",
    passwordField: "login_form/input_3/input_5",
  },
  "www.ilias.uni-koeln.de": {
    method: "form",
    loginUrl:
      "https://www.ilias.uni-koeln.de/ilias/ilias.php?lang=de&client_id=uk&cmd=post&cmdClass=ilstartupgui&cmdNode=12k&baseClass=ilStartUpGUI&rtoken=",
    default_landing_url: "",
    usernameField: "username",
    passwordField: "password",
    extraFields: ["cmd[doStandardAuthentication]", "Anmelden"],
  },
  "ilias.your-university.de": {
    method: "form",
    loginUrl:
      "https://ilias.your-university.de/ilias.php?baseClass=ilstartupgui&cmd=post",
    default_landing_url: "",
    usernameField: "user",
    passwordField: "pass",
  },
};

async function loginToILIAS() {
  const currentHost = window.location.hostname;

  const loginUrl = KNOWN_LOGIN_SITES[currentHost]
    ? KNOWN_LOGIN_SITES[currentHost].loginUrl
    : `https://${currentHost}/ilias.php?baseClass=ilstartupgui&cmd=post`;

  const formUsername = KNOWN_LOGIN_SITES[currentHost]
    ? KNOWN_LOGIN_SITES[currentHost].usernameField
    : "login_form/input_3/input_4";

  const formPassword = KNOWN_LOGIN_SITES[currentHost]
    ? KNOWN_LOGIN_SITES[currentHost].passwordField
    : "login_form/input_3/input_5";

  chrome.runtime.sendMessage({ action: "requestData" }, async (response) => {
    if (!response.username || !response.password)
      return console.error("Missing credentials");

    const formData = new FormData();
    formData.append(formUsername, response.username);
    formData.append(formPassword, response.password);

    if (KNOWN_LOGIN_SITES[currentHost]?.extraFields?.length > 0) {
      for (
        let i = 0;
        i < KNOWN_LOGIN_SITES[currentHost].extraFields.length;
        i += 2
      ) {
        const key = KNOWN_LOGIN_SITES[currentHost].extraFields[i];
        const value = KNOWN_LOGIN_SITES[currentHost].extraFields[i + 1];
        if (key && value) {
          formData.append(key, value);
        }
      }
    }

    const fetchOptions = {
      method: "POST",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      body: formData,
      credentials: "include",
    };

    const res = await fetch(loginUrl, fetchOptions);
    console.log(res.ok ? "Login successful" : "Login failed", res.statusText);
    if (res.ok) {
      chrome.runtime.sendMessage({ action: "setBadge", text: "✔" });
    } else {
      chrome.runtime.sendMessage({ action: "setBadge", text: "✘" });
    }
    hideLoginOverlay();
  });
}
var lastTimeRecorded = Date.now();
document.addEventListener("visibilitychange", () => {
  const nowTime = Date.now();
  if (nowTime - lastTimeRecorded < 120000) return; // don't do anything under 2 minutes
  if (nowTime - lastTimeRecorded > 1800000) showLoginOverlay(); // after half an hour, wait two secs so you don't loose the current view
  if (document.visibilityState === "visible") loginToILIAS();
  lastTimeRecorded = Date.now();
});

function injectLoginOverlay() {
  // Check if overlay already exists to avoid duplicates
  if (document.getElementById("ilias-helper-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "ilias-helper-overlay";
  overlay.innerHTML = `
      <div class="overlay-content">
          <p>ILIAS Helper<br>Logging in, hold on...</p>
          <div class="spinner"></div>
      </div>
      <style>
          #ilias-helper-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: rgba(0, 0, 0, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              color: white;
              font-size: 24px;
              text-align: center;
              font-family: Arial, sans-serif;
          }
          .overlay-content {
              background: rgba(0, 0, 0, 0.8);
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
          }
          .spinner {
              margin: 20px auto;
              width: 40px;
              height: 40px;
              border: 4px solid rgba(255, 255, 255, 0.3);
              border-top: 4px solid white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
          }
          @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
          }
      </style>
  `;

  document.body.appendChild(overlay);
}

function showLoginOverlay() {
  injectLoginOverlay(); // Ensure it's injected before showing
  document.getElementById("ilias-helper-overlay").style.display = "flex";
}

function hideLoginOverlay() {
  const overlay = document.getElementById("ilias-helper-overlay");
  if (overlay) overlay.style.display = "none";
}
