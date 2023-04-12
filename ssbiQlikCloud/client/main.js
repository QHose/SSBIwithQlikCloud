import { Template } from "meteor/templating";
// import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from "meteor/session";
// import "main.html";
import "./main.html";
import axios from "axios";

var server,
  QMCUrl,
  hubUrl,
  sheetUrl,
  appUrl = "";

Template.mainLayout.helpers({
  currentUser() {
    if (Session.get("currentUser")) {
      return "  ( with " + Session.get("currentUser") + " signed on using JWT)";
    }
  },
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
  Session.set("appId", Meteor.settings.public.SSBI.appId1);
  Session.set("sheetId", Meteor.settings.public.SSBI.sheetId1);
  server = Meteor.settings.public.tenantDomain;
  server = "https://" + server;

  console.log("server", server);
  QMCUrl = server + "/console";
  hubUrl = server + "/hub";
  sheetUrl = server + "/sense/app/" + Session.get("appId");
  console.log("sheetUrl", sheetUrl);
  appUrl =
    server +
    "/sense/app/" +
    Session.get("appId") +
    "/sheet/" +
    Session.get("sheetId") +
    "/state/analysis";
  console.log("SSBIApp URL", appUrl);
  console.log("console URL", QMCUrl);
  Session.set("IFrameUrl", appUrl);
});

Template.SSBISenseIFrame.onRendered(function () {
  this.$(".SSBIIFrame").transition("slide in right");
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
  "click #users .item"(event, target) {
    // console.log("user clicked", event);
    $("#users .item").removeClass("active");
    $(event.target).addClass("active");
  },
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
});

Template.senseButtons.events({
  "click #page .item"(event, template) {
    // console.log("page selector clicked", event);
    template.$("#page .item").removeClass("active");
    $(event.target).addClass("active");
    $(this).addClass("active");
  },
  "click #app .item"(event, template) {
    // console.log("app selector clicked", event);
    template.$(" .item").removeClass("active");
    $(event.target).addClass("active");

    $(this).addClass("active");
  },
  "click #app1 "() {
    Session.set("appId", Meteor.settings.public.SSBI.appId1);
    Session.set("sheetId", Meteor.settings.public.SSBI.sheetId1);
  },
  "click #app2 "() {
    Session.set("appId", Meteor.settings.public.SSBI.appId2);
    Session.set("sheetId", Meteor.settings.public.SSBI.sheetId2);
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
    // Session.set("IFrameUrl", QMCUrl);
    window.open(QMCUrl, '_blank');
  },
  "click .hub "() {
    window.open(hubUrl, '_blank');
  }
});

Template.SSBIUsers.onCreated(function () {
  Session.set("appUrl", appUrl);
});

Template.SSBIUsers.onRendered(function () {
  // this.$(".ui.accordion").accordion();

});

async function login(passport) {
  console.log("🚀 ~ file: SSBI.js:136 ~ login ~ passport:", passport);
  try {
    Session.set("currentUser", passport.UserId);
    await Meteor.call("getJWTToken", passport, async function (error, token) {
      Session.set("IFrameUrl", null);
      if (error) {
        console.error("Error getJWTToken", error);
      } else {
        var URLtoOpen = Session.get("appUrl"); // the url of the sense page hub-app-sheet
        await jwtLogin(token);
        await isLoggedIn();
        console.log("login: the url to open is: ", URLtoOpen);
        Session.set("IFrameUrl", URLtoOpen); // when this var is set, the iframe will be rerendered with the new URL 
      }
    });
  } catch (err) {
    console.error(err);
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
  

  return true;
}

async function isLoggedIn(){
  const user = await checkLoggedIn();
  console.log("🚀 ~ file: main.js:206 ~ isLoggedIn ~ user:", user)
  if (!user.name) {
    const message =
      "Third-party cookies are not enabled in your browser settings and/or browser mode.";
    alert(message);
    throw new Error(message);
  }
  console.log("Current user logged in into Qlik: ", user);
}


async function jwtLogin(token) {
  console.log(
    `🚀 jwtLogin ~ Now using the token received from the server to make a client side call to  https://${Meteor.settings.public.tenantDomain}/login/jwt-session?qlik-web-integration-id=${Meteor.settings.public.qlikWebIntegrationId} with jwtLogin ~ token:`,
    token
  );
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
  ).then(response => response.json());
}

Template.userCards.onRendered(function () {
  // this.$(".dimmable.image").dimmer({
  //   on: "hover",
  // });
  this.$(".menu").transition("scale in");
});

Template.senseButtons.onRendered(function () {
  this.$(".menu").transition("scale in");
});
