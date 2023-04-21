import { Template } from "meteor/templating";
// import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from "meteor/session";
// import "main.html";
import "./main.html";
import axios from "axios";

// Meteor.startup(function () {
//
// });

var server,
  QMCUrl,
  hubUrl,
  sheetOverviewUrl,
  singleSheet
   = "";

Template.mainLayout.helpers({
  currentUser() {
    if (Session.get("currentUser")) {
      return "  ( with " + Session.get("currentUser") + " signed on using JWT)";
    }
  },
  show() {
    return Session.get("currentUser");
  },
});

Tracker.autorun(() => {
  var url = "";
  // Session.set('url', "");
  var user = Session.get("currentUser");
  console.log(
    "!!!!!!!!!!!! Tracker.autorun change detected, current user",
    user
  );
  var appId = Session.get("appId");
  var sheetId =  Session.get("sheetId");
  // console.log("Qlik Tenant:", server);
  console.log("appId: ", appId);
  console.log("sheetId: ",sheetId);
  var IFrameURL = Session.get("IFrameUrl");
  console.log("path requested: ",IFrameURL);

  //which Sense screen to show?
  server = "https://" + Meteor.settings.public.tenantDomain;
  QMCUrl = server + "/console";
  hubUrl = server;
  var sheetOverviewUrl = server + "/sense/app/" + appId;
  var singleSheet =  `${server}/sense/app/${appId}/sheet/${sheetId}/state/analysis`;
  var singleAPI = `${server}/single/?appid=${appId}&sheet=${sheetId}&opt=ctxmenu,currsel`;

  switch (IFrameURL) {
    case "sheetOverview":
      url = sheetOverviewUrl
      break;
    case "singleSheet":
      url = singleSheet
      break;
    case "singleAPI":
      url = singleAPI;
      console.log("🚀 ~ singleAPI url:", url)
      break;
    default: //no selection made yet for the path inside qlik.
      url = singleSheet;
  }
  Session.set('url', url);
  console.log("URL inserted into the IFrame: ", url);
  // if (user) {
  //   console.log("🚀 ~ file: main.js:62 ~ Tracker.autorun ~ user found, nu inserting iframe url:", user)
  //   //hack to refresh the iframe
  //   try {
  //     $('#SSBIIFrame').attr('src', url)
  //     // document.getElementById("SSBIIFrame").src = url;
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }
});

Template.SSBIUsers.onCreated(function () {
  delete Session
    .keys[("currentUser", "appId", "IFrameUrl", "sheetId", "loadingIndicator")];
  // Session.set("loadingIndicator", "");
  // Session.set("currentUser", null);
  Session.set("appId", Meteor.settings.public.SSBI.appId1);
  Session.set("sheetId", Meteor.settings.public.SSBI.sheetId1);
  Session.set("IFrameUrl", "singleSheet");
  // console.log("onCreated appId: ", Session.get("appId"));
  // console.log("onCreated sheetId: ", Session.get("sheetId"));
});

Template.SSBISenseIFrame.onRendered(function () {
  this.$(".SSBIIFrame").transition("slide in right");
});

Template.SSBISenseIFrame.helpers({
  url() {
    var url = Session.get("url");
    console.log('-------SSBISenseIFrame.helpers -  URL changed: '+ url)
    return url;
  },
});

Template.senseButtons.helpers({
  app1() {
    return Meteor.settings.public.SSBI.app1Name;
  },
  app2() {
    return Meteor.settings.public.SSBI.app2Name;
  },
  app3() {
    return Meteor.settings.public.SSBI.app3Name;
  },
  app4() {
    return Meteor.settings.public.SSBI.app4Name;
  },
  JWTIOLink() {
    return "https://jwt.io/#id_token=" + Session.get("token");
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
      Groups: ["anonymous", "CONSUMER", "UNITED STATES", "AMER"],
    };
    login(passport);
  },
  "click .contributor"() {
    var passport = {
      UserId: "Linda",
      Groups: ["CONTRIBUTOR", "GERMANY", "EMEA"],
    };
    login(passport);
  },
  "click .developer"() {
    var passport = {
      UserId: "Martin",
      Groups: ["DEVELOPER", "EMEA", "AMER", "APAC"],
    };
    login(passport);
  },
  "click .admin"(e, t) {    
    window.open(Meteor.settings.public.SSBI.videoPaul, "_blank");

    // var passport = {
    //   UserId: "Paul",
    //   Groups: ["ADMIN"],
    // };
    // login(passport);
  },
});

Template.senseButtons.events({
  "click #page .item"(event, template) {
    template.$("#page .item").removeClass("active");
    $(event.target).addClass("active");
    $(this).addClass("active");
  },
  "click #app .item"(event, template) {
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
  "click #app3 "() {
    Session.set("appId", Meteor.settings.public.SSBI.appId3);
    Session.set("sheetId", Meteor.settings.public.SSBI.sheetId3);
  },
  "click #app4 "() {
    Session.set("appId", Meteor.settings.public.SSBI.appId4);
    Session.set("sheetId", Meteor.settings.public.SSBI.sheetId4);
  },
  "click #sheetOverview "() {
    Session.set("IFrameUrl", "sheetOverview");
  },
  "click #singleSheet"() {
    Session.set("IFrameUrl", "singleSheet");
  },
  "click #singleAPI"() {
    Session.set("IFrameUrl", "singleAPI");
    console.log("🚀 ~ file: main.js:216 ~ singleAPI clicked:")
  },
  "click #qmc "() {
    window.open(QMCUrl, "_blank");
  },
  "click #hub "() {
    window.open(hubUrl, "_blank");
  },
});

Template.SSBIUsers.onRendered(function () {
  // this.$(".ui.accordion").accordion();
});

async function login(passport) {
  // console.log("🚀 ~ file: SSBI.js:136 ~ login ~ passport:", passport);
  try {
    await Meteor.call("getJWTToken", passport, async function (error, token) {
      if (error) {
        console.error("Error getJWTToken", error);
      } else {
        Session.set("url", null);
        await jwtLogin(token);
        await isLoggedIn();
        Session.set("currentUser", passport.UserId);
        Session.set("token", token);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

async function isLoggedIn() {
  const user = await checkLoggedIn();
  // console.log("🚀 ~ file: main.js:206 ~ isLoggedIn ~ user:", user);
  if (!user.name) {
    const message =
      "Third-party cookies are not enabled in your browser settings and/or browser mode.";
    alert(message);
    throw new Error(message);
  }
  console.log("Current user logged in into Qlik: ", user);
}

async function jwtLogin(token) {
  // console.log(
  //   `🚀 jwtLogin ~ Now using the token received from the server to make a client side call to  https://${Meteor.settings.public.tenantDomain}/login/jwt-session?qlik-web-integration-id=${Meteor.settings.public.qlikWebIntegrationId} with jwtLogin ~ token:`,
  //   token
  // );
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
  ).then((response) => response.json());
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
