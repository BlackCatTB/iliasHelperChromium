// popup.js
console.log = (...args) =>
  chrome.runtime.sendMessage({ type: "test", message: args });

document.getElementById("saveButton").addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const agressiveMode = document.getElementById("agressiveMode").checked;

  chrome.runtime.sendMessage({
    action: "saveData",
    data: { username, password, agressiveMode },
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
    document.getElementById("agressiveMode").checked =
      response.agressiveMode || false;
    hideLoadingOverlay();
  });
}
fetchSavedData();

document.getElementById("tester").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "test" });
});
