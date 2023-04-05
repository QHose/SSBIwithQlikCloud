import { Meteor } from 'meteor/meteor';
import "./serverFunctions";
const fs = require("fs");


Meteor.startup(function() {
  SSLProxy({
     port: 3001, //or 443 (normal port/requires sudo)
     ssl : {
          key: fs.readFileSync(
            Meteor.settings.private.certificatesDirectory + "/server.key",
            "utf8"
          ),
          cert: fs.readFileSync(
            Meteor.settings.private.certificatesDirectory + "/server.cert",
            "utf8"
          )

          //Optional CA
          //Assets.getText("ca.pem")
     }
  });
});