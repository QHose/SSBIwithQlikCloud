import { Meteor } from 'meteor/meteor';
import "./serverFunctions";
import helmet from "helmet";
import crypto from 'crypto';
// const fs = require("fs");


Meteor.startup(function () {
  
  // Genereer een unieke nonce per request
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals = { nonce }; // Maak beschikbaar voor later gebruik

    WebApp.addHtmlAttributeHook(() => ({ lang: 'en' }));    
    WebApp.connectHandlers.use(
      
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", `'nonce-${nonce}'`],
          connectSrc: ['*'],
          imgSrc: ["'self'", 'https://*.qlik.com', 'https://user-images.githubusercontent.com', 'https://lucidchart.com', 'https://github.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://*.qlik.com', 'https://fonts.googleapis.com/css'],
          frameSrc: ['https://integration.eu.qlikcloud.com', 'https://integrationdemo2.qlik.com', 'https://integrationdemo3.qlik.com', 'https://*.qlik.com'],
          frameAncestors: ["'self'", "https://integration.qlik.com"]
        }
      }),
  
      // crossOriginResourcePolicy: { policy: "cross-origin" },
      // crossOriginEmbedderPolicy: false,
    );
  
    // https://guide.meteor.com/security#csp.
    //https://docs.meteor.com/packages/browser-policy
    BrowserPolicy.content.disallowInlineScripts();
    BrowserPolicy.framing.disallow();
  
    WebApp.rawConnectHandlers.use((_, res, next) => {
      // Cache control
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
      // Prevent Adobe stuff loading content on our site
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
      // Frameguard - https://helmetjs.github.io/docs/frameguard/
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
       
      // res.setHeader('frame-ancestors', 'https://integration.qlik.com');
      // X-XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      // //cache control
      // res.setHeader('X-XSS-Protection', '1; mode=block');
  
      // Expect CT
      res.setHeader('Expect-CT', 'enforce, max-age=604800');
  
  
      var domain = 'https://integrationdemo2.qlik.com'
  
      // res.setHeader('Content-Security-Policy', 'frame-ancestors', 'self');
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3030');
      res.setHeader('Access-Control-Allow-Origin', domain);
      res.setHeader('Access-Control-Allow-Origin', 'https://saasdemo.qlik.com');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
      return next();
    });

});