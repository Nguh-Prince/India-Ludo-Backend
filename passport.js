const passport = require('passport'); 
const dotenv = require('dotenv')
const GoogleStrategy = require('passport-google-oauth2').Strategy; 
const { CONFIG } = require('./utils/config.js')

dotenv.config();
  
passport.serializeUser((user , done) => { 
    done(null , user); 
}) 
passport.deserializeUser(function(user, done) { 
    done(null, user); 
}); 
  
passport.use(new GoogleStrategy({ 
    clientID: CONFIG.GOOGLE_CLIENT_ID, // Your Credentials here. 
    clientSecret: CONFIG.GOOGLE_SECRET_KEY, // Your Credentials here. 
    callbackURL: CONFIG.GOOGLE_CALLBACK_URL, 
    passReqToCallback:true
  }, 
  function(request, accessToken, refreshToken, profile, done) { 
    return done(null, profile); 
  } 
));