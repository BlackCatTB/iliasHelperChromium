chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);

  if (request.type === "refresh") loginToILIAS();
});

async function loginToILIAS() {
  const loginUrl =
    "https://ilias3.uni-stuttgart.de/ilias.php?baseClass=ilstartupgui&cmd=post&fallbackCmd=doStandardAuthentication&lang=de&client_id=Uni_Stuttgart";
  chrome.runtime.sendMessage({ action: "requestData" }, async (response) => {
    if (!response.username || !response.password)
      return console.error("Missing credentials");

    const formData = new FormData();
    formData.append("login_form/input_3/input_4", response.username);
    formData.append("login_form/input_3/input_5", response.password);

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
  });
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") loginToILIAS();
});
