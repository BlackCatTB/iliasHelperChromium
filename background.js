function sendMessageToContentScript(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;

    chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "Error sending message:",
          chrome.runtime.lastError.message
        );
      } else {
        console.log("Response from content script:", response);
      }
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.type === "cookies") {
    sendResponse({ data: message.data, message: "hello" });
  } else if (message.action === "requestData") {
    chrome.storage.local.get(
      ["username", "password", "agressiveMode"],
      (data) => {
        sendResponse({
          username: data.username,
          password: data.password,
          agressiveMode: data.agressiveMode,
        });
      }
    );
    return true;
  } else if (message.action === "saveData") {
    chrome.storage.local.set(message.data, () =>
      sendResponse({ success: true })
    );
    return true;
  } else if (message.action === "logMeIn") {
    if (chrome.tab) chrome.tabs.sendMessage(chrome.tab.id, { type: "refresh" });
    // chrome.tab.sendMessage(tab.id, { type: "refresh" });
  } else if (message.action === "test") {
    sendMessageToContentScript({
      action: "greet",
      data: "Hello from Background!",
    });
  }
});
