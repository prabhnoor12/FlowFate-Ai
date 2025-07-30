import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../prisma/client.js'; // Adjust import if needed

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user in your DB
    let user = await User.findUnique({ where: { googleId: profile.id } });
    if (!user) {
      user = await User.create({
        data: {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        }
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Serialize/deserialize (not needed if session: false)
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
