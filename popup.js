console.log = (...args) =>
  chrome.runtime.sendMessage({ type: "test", message: args });

document.getElementById("saveButton").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  // const agressiveMode = document.getElementById("agressiveMode").checked;

  chrome.runtime.sendMessage({
    action: "saveData",
    data: { username, password /* , agressiveMode */ },
  });
});

document.getElementById("logMeInButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "logMeIn" });
});

function showLoadingOverlay() {
  document.getElementById("loading-overlay").classList.remove("hidden");
}

function hideLoadingOverlay() {
  document.getElementById("loading-overlay").classList.add("hidden");
}

async function fetchSavedData() {
  showLoadingOverlay();
  chrome.runtime.sendMessage({ action: "requestData" }, (response) => {
    if (chrome.runtime.lastError)
      return console.error(chrome.runtime.lastError);
    document.getElementById("username").value = response.username || "";
    document.getElementById("password").value = response.password || "";
    // document.getElementById("agressiveMode").checked =
    //   response.agressiveMode || false;
    hideLoadingOverlay();
  });
}
fetchSavedData();

// site permission enabler
document
  .getElementById("enableSiteButton")
  .addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = new URL(tab.url);
    const originPattern = `${url.origin}/*`;

    chrome.permissions.request({ origins: [originPattern] }, (granted) => {
      if (granted) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      } else {
        console.warn("User denied permission for:", originPattern);
      }
    });
  });
