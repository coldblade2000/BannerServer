const passport = require("passport");
const {GOOGLE} = require("../secrets");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const {User} = require('../MongoDB/models/models')

passport.use(new GoogleStrategy({
        passReqToCallback: true,
        clientID: GOOGLE.GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback'
    },
    (req, accessToken, refreshToken, profile, done) => {
        //console.log("found req in the auth part: ",req)
        //console.log("Got to verify. Profile: ", profile)
        User.findOne({googleId: profile.id})
            .then(async (currentUser) => {
                if (currentUser) {
                    return done(null, currentUser)
                } else {
                    console.log(profile)
                    const username = req.session.desiredusername;
                    delete req.session.desiredusername;
                    const founduser = await User.findById(username).exec()
                    if (founduser) {
                        if (founduser['_id'] === currentUser['_id']) {
                            return done(null, founduser)
                        } else {
                            return done(null, false, {'message': 'ID mismatch with same Username'})
                        }
                    }
                    if (username) {
                        new User({
                            "_id": username,
                            'email': profile.emails[0].value,
                            "realName": profile.displayName,
                            'googleId': profile.id
                        }).save().then((newUser) => {
                            return done(null, newUser)
                        })
                    } else {
                        return done(null, false, {'message': 'Tried to login into a nonexistent account'})

                    }
                }
            })
    }))


passport.serializeUser((user, done) => {
    console.log("Serialize user: " + user)

    done(null, user["_id"]);
});
passport.deserializeUser((id, done) => {
    console.log("Deserialize ID: " + id)
    User.findById(id).then(user => {
        done(null, user);
    });
});

module.exports = passport