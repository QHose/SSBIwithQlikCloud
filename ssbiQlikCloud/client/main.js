import { Template } from 'meteor/templating';
// import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from "meteor/session";
// import "main.html";
import './main.html';
import  axios from  'axios';

var server,
  QMCUrl,
  hubUrl,
  sheetUrl,
  appUrl = "";

Template.SSBISenseApp.helpers({
  show() {
    return Session.get("currentUser") &&
      !Session.equals("loadingIndicator", "loading")
      ? "Yes"
      : null;
  },
});

Template.SSBIUsers.onCreated(function () {
  Session.set("loadingIndicator", "");
  Session.set("currentUser", null);
  server = Meteor.settings.public.tenantDomain;
  server = "https://" + server;
 
  var appId = Meteor.settings.public.SSBI.appId;
  console.log("server", server);
  QMCUrl = server + "/console";
  hubUrl = server + "/hub";
  sheetUrl = server + "/sense/app/" + appId;
  console.log("sheetUrl", sheetUrl);
  appUrl =
    server +
    "/sense/app/" +
    appId +
    "/sheet/" +
    Meteor.settings.public.SSBI.sheetId +
    "/state/analysis";
  console.log("SSBIApp URL", appUrl);
});

Template.SSBISenseIFrame.onRendered(function () {
  this.$(".IFrameSense").transition("slide in right");
});

Template.SSBISenseIFrame.helpers({
  appURL() {
    // console.log('SSBISenseIFrame helper: de app url is: ', Session.get('appUrl'));
    return Session.get("IFrameUrl");
  },
});

Template.SSBIUsers.helpers({
  currentUser() {
    if (Session.get("currentUser")) {
      return "(" + Session.get("currentUser") + " currently logged in)";
    }
  },
  user() {
    return Session.get("currentUser");
  },
  showSenseButtons() {
    return Session.get("currentUser") &&
      !Session.equals("loadingIndicator", "loading")
      ? "Yes"
      : null;
  },
});

Template.SSBIUsers.events({
  "click .consumer"() {
    var passport = {
      UserId: "John",
      Groups: ["anonymous", "CONSUMER", "UNITED STATES"],
    };
    login(passport);
  },
  "click .contributor"() {
    var passport = {
      UserId: "Linda",
      Groups: ["CONTRIBUTOR", "UNITED STATES"],
    };
    login(passport);
  },
  "click .developer"() {
    var passport = {
      UserId: "Martin",
      Groups: ["DEVELOPER"],
    };
    login(passport);
  },
  "click .admin"(e, t) {
    var passport = {
      UserId: "Paul",
      Groups: ["CONTRIBUTOR", "UNITED STATES"],
    };
    login(passport);
  },
  "click .selfservice "() {
    $(".ui.modal.SSBI").modal("show").modal("refresh").modal("refresh");
  },
  "click .hub "() {
    Session.set("IFrameUrl", hubUrl);
  },
  "click .sheet "() {
    Session.set("IFrameUrl", sheetUrl);
  },
  "click .app "() {
    Session.set("IFrameUrl", appUrl);
  },
  "click .QMC "() {
    Session.set("IFrameUrl", QMCUrl);
  },
});

Template.SSBIUsers.onCreated(function () {
  Session.set("appUrl", appUrl);
});

Template.SSBIUsers.onRendered(function () {
  // this.$(".ui.accordion").accordion();
});

function waitTwoSeconds() {
  return new Promise((resolve, reject) => {
    Meteor.setTimeout(() => {
      resolve();
    }, 2000);
  });
}

async function login(passport) {
  console.log("🚀 ~ file: SSBI.js:136 ~ login ~ passport:", passport);
  try {
    // await logoutCurrentUser();
    
    Session.set("currentUser", passport.UserId);    
    Session.set("IFrameUrl", "https://" + Meteor.settings.public.tenantDomain + "/logout");
    await waitTwoSeconds();
    console.log('Two seconds have passed after calling the logout...');


    await Meteor.call("getJWTToken", passport, async function (error, token) {
      if (error) {
        console.error("Error getJWTToken", error);
      } else {
        // console.log("🚀 ~ file: SSBI.js:151 ~ login ~ token:", token);
        var URLtoOpen = Session.get("appUrl");
        console.log("------------------------------------");
        console.log(
          "requesting JWT at Qlik cloud JWT IdP  with passport: " +
            JSON.stringify(passport)
        );
        console.log("------------------------------------");

        await jwtLogin(token);
        await waitTwoSeconds();

        console.log("login: the url to open is: ", URLtoOpen);
        Session.set("IFrameUrl", URLtoOpen);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

async function logoutCurrentUser() {
  console.log("🚀 ~ file: main.js:161 ~ logoutCurrentUser")
  
  try {
    const response = await axios.get('https://bies.eu.qlikcloud.com/logout');
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

async function qlikLogin() {
  const tokenRes = await (await getJWTToken(JWTENDPOINT)).json();
  const loginRes = await jwtLogin(tokenRes.token);
  console.log(
    "🚀 ~ file: index.html:46 ~ qlikLogin ~ login result status",
    loginRes
  );
  if (loginRes.status != 200) {
    const message = "Something went wrong while logging in.";
    alert(message);
    throw new Error(message);
  }
  const recheckLoggedIn = await checkLoggedIn();
  if (recheckLoggedIn.status !== 200) {
    const message =
      "Third-party cookies are not enabled in your browser settings and/or browser mode.";
    alert(message);
    throw new Error(message);
  }
  console.log("Logged in!", loginRes);

  return true;
}

async function jwtLogin(token) {
  console.log(`🚀 jwtLogin ~ Now using the token received from the server to make a client side call to  https://${Meteor.settings.public.tenantDomain}/login/jwt-session?qlik-web-integration-id=${Meteor.settings.public.qlikWebIntegrationId} with jwtLogin ~ token:`,  token);
  const authHeader = `Bearer ${token}`;
  return await fetch(
    `https://${Meteor.settings.public.tenantDomain}/login/jwt-session?qlik-web-integration-id=${Meteor.settings.public.qlikWebIntegrationId}`,
    {
      credentials: "include",
      mode: "cors",
      method: "POST",
      headers: {
        Authorization: authHeader,
        "qlik-web-integration-id": Meteor.settings.public.qlikWebIntegrationId,
      },
    }
  );
}

async function checkLoggedIn() {
  return await fetch(
    `https://${Meteor.settings.public.tenantDomain}/api/v1/users/me`,
    {
      mode: "cors",
      credentials: "include",
      headers: {
        "qlik-web-integration-id": Meteor.settings.public.qlikWebIntegrationId,
      },
    }
  );
}

Template.userCards.onRendered(function () {
  // this.$(".dimmable.image").dimmer({
  //   on: "hover",
  // });
  // this.$(".column").transition("scale in");

  this.$("#flyoutnavkbfixed").focus();

  !(function () {
    var w = window,
      d = w.document;

    if (w.onfocusin === undefined) {
      d.addEventListener("focus", addPolyfill, true);
      d.addEventListener("blur", addPolyfill, true);
      d.addEventListener("focusin", removePolyfill, true);
      d.addEventListener("focusout", removePolyfill, true);
    }
    function addPolyfill(e) {
      var type = e.type === "focus" ? "focusin" : "focusout";
      var event = new CustomEvent(type, { bubbles: true, cancelable: false });
      event.c1Generated = true;
      e.target.dispatchEvent(event);
    }
    function removePolyfill(e) {
      if (!e.c1Generated) {
        // focus after focusin, so chrome will the first time trigger tow times focusin
        d.removeEventListener("focus", addPolyfill, true);
        d.removeEventListener("blur", addPolyfill, true);
        d.removeEventListener("focusin", removePolyfill, true);
        d.removeEventListener("focusout", removePolyfill, true);
      }
      setTimeout(function () {
        d.removeEventListener("focusin", removePolyfill, true);
        d.removeEventListener("focusout", removePolyfill, true);
      });
    }
  })();

  function hasClass(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    } else {
      return new RegExp("(^| )" + className + "( |$)", "gi").test(el.className);
    }
  }

  var menuItems1 = document.querySelectorAll(
    "#flyoutnavkbfixed li.has-submenu"
  );
  var timer1, timer2;

  Array.prototype.forEach.call(menuItems1, function (el, i) {
    el.addEventListener("mouseover", function (event) {
      this.className = "has-submenu open";
      clearTimeout(timer1);
    });
    el.addEventListener("mouseout", function (event) {
      timer1 = setTimeout(function (event) {
        var opennav = document.querySelector(
          "#flyoutnavkbfixed .has-submenu.open"
        );
        opennav.className = "has-submenu";
        opennav.querySelector("a").setAttribute("aria-expanded", "false");
      }, 1000);
    });
    el.querySelector("a").addEventListener("click", function (event) {
      if (this.parentNode.className == "has-submenu") {
        this.parentNode.className = "has-submenu open";
        this.setAttribute("aria-expanded", "true");
      } else {
        this.parentNode.className = "has-submenu";
        this.setAttribute("aria-expanded", "false");
      }
      event.preventDefault();
    });
    var links = el.querySelectorAll("a");
    Array.prototype.forEach.call(links, function (el, i) {
      el.addEventListener("focus", function () {
        if (timer2) {
          clearTimeout(timer2);
          timer2 = null;
        }
      });
      el.addEventListener("blur", function (event) {
        timer2 = setTimeout(function () {
          var opennav = document.querySelector(
            "#flyoutnavkbfixed .has-submenu.open"
          );
          if (opennav) {
            opennav.className = "has-submenu";
            opennav.querySelector("a").setAttribute("aria-expanded", "false");
          }
        }, 10);
      });
    });
  });
});

Template.senseButtons.onRendered(function () {
  this.$(".SenseIframe").transition("swing up");

  !(function () {
    var w = window,
      d = w.document;

    if (w.onfocusin === undefined) {
      d.addEventListener("focus", addPolyfill, true);
      d.addEventListener("blur", addPolyfill, true);
      d.addEventListener("focusin", removePolyfill, true);
      d.addEventListener("focusout", removePolyfill, true);
    }
    function addPolyfill(e) {
      var type = e.type === "focus" ? "focusin" : "focusout";
      var event = new CustomEvent(type, { bubbles: true, cancelable: false });
      event.c1Generated = true;
      e.target.dispatchEvent(event);
    }
    function removePolyfill(e) {
      if (!e.c1Generated) {
        // focus after focusin, so chrome will the first time trigger tow times focusin
        d.removeEventListener("focus", addPolyfill, true);
        d.removeEventListener("blur", addPolyfill, true);
        d.removeEventListener("focusin", removePolyfill, true);
        d.removeEventListener("focusout", removePolyfill, true);
      }
      setTimeout(function () {
        d.removeEventListener("focusin", removePolyfill, true);
        d.removeEventListener("focusout", removePolyfill, true);
      });
    }
  })();

  function hasClass(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    } else {
      return new RegExp("(^| )" + className + "( |$)", "gi").test(el.className);
    }
  }

  var menuItems1 = document.querySelectorAll(
    "#flyoutnavkbfixed li.has-submenu"
  );
  var timer1, timer2;

  Array.prototype.forEach.call(menuItems1, function (el, i) {
    el.addEventListener("mouseover", function (event) {
      this.className = "has-submenu open";
      clearTimeout(timer1);
    });
    el.addEventListener("mouseout", function (event) {
      timer1 = setTimeout(function (event) {
        var opennav = document.querySelector(
          "#flyoutnavkbfixed .has-submenu.open"
        );
        opennav.className = "has-submenu";
        opennav.querySelector("a").setAttribute("aria-expanded", "false");
      }, 1000);
    });
    el.querySelector("a").addEventListener("click", function (event) {
      if (this.parentNode.className == "has-submenu") {
        this.parentNode.className = "has-submenu open";
        this.setAttribute("aria-expanded", "true");
      } else {
        this.parentNode.className = "has-submenu";
        this.setAttribute("aria-expanded", "false");
      }
      event.preventDefault();
    });
    var links = el.querySelectorAll("a");
    Array.prototype.forEach.call(links, function (el, i) {
      el.addEventListener("focus", function () {
        if (timer2) {
          clearTimeout(timer2);
          timer2 = null;
        }
      });
      el.addEventListener("blur", function (event) {
        timer2 = setTimeout(function () {
          var opennav = document.querySelector(
            "#flyoutnavkbfixed .has-submenu.open"
          );
          if (opennav) {
            opennav.className = "has-submenu";
            opennav.querySelector("a").setAttribute("aria-expanded", "false");
          }
        }, 10);
      });
    });
  });
});
