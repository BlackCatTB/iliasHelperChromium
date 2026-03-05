(function () {
  const profiles = [
    {
      id: "uni_stuttgart",
      hosts: ["ilias3.uni-stuttgart.de"],
      loginUrl:
        "https://ilias3.uni-stuttgart.de/ilias.php?baseClass=ilstartupgui&cmd=post&fallbackCmd=doStandardAuthentication&lang=de&client_id=Uni_Stuttgart",
      usernameField: "login_form/input_3/input_4",
      passwordField: "login_form/input_3/input_5",
      headers: {
        Origin: "https://ilias3.uni-stuttgart.de",
        Referer:
          "https://ilias3.uni-stuttgart.de/login.php?client_id=Uni_Stuttgart&cmd=force_login&lang=de",
      },
    },
    {
      id: "uni_koeln",
      hosts: ["www.ilias.uni-koeln.de"],
      loginUrl:
        "https://www.ilias.uni-koeln.de/ilias/ilias.php?lang=de&client_id=uk&cmd=post&cmdClass=ilstartupgui&cmdNode=12k&baseClass=ilStartUpGUI",
      usernameField: "username",
      passwordField: "password",
      extraFields: {
        "cmd[doStandardAuthentication]": "Anmelden",
      },
    },
  ];

  function getDefaultProfile(host) {
    return {
      id: "default",
      hosts: [host],
      loginUrl: `https://${host}/ilias.php?baseClass=ilstartupgui&cmd=post`,
      usernameField: "username",
      passwordField: "password",
      extraFields: {},
      headers: {},
    };
  }

  function resolveProfile(host) {
    const found = profiles.find((profile) => profile.hosts.includes(host));
    return found || getDefaultProfile(host);
  }

  function shouldRedirectAfterLogin(url) {
    return /login\.php|force_login|reloadpublic=1/.test(url);
  }

  globalThis.ILIASProfiles = {
    profiles,
    resolveProfile,
    shouldRedirectAfterLogin,
  };
})();
