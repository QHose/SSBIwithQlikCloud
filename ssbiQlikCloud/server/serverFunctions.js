import { Meteor } from "meteor/meteor";
var fs = require("fs-extra");
const path = require("path");
// var os = require("os");
// var ip = require("ip");
const token = require("./token");
const { v4: uuidv4 } = require("uuid");


//
// ─── METEOR METHODS ─────────────────────────────────────────────────────────────
//

Meteor.methods({
  //https://qlik.dev/authenticate/jwt/create-signed-tokens-for-jwt-authorization
  getJWTToken(passport) {
    console.log("get JWT with passport", passport);

    try {
      const uuid = uuidv4();
      const sub = `sub_${uuid}`;
      const name = passport.UserId;
      const email = `${uuid}@demo.anon`;
      const groups = passport.Groups;

      const genT = token.generate(sub, name, email, groups);
      console.log("🚀 ~ file: QPSFunctions.js:423 ~ getJWTToken ~ genT:", genT)
      return genT;
    } catch (err) {
      console.error(
        "unable to generate JWT token, did you supply the correct public.pem and private.pem in the dir: "+Meteor.settings.private.certificatesDirectory,
        err
      );
      throw new Meteor.Error("generate jwt token failed", err.message);
    }
  }
})

  