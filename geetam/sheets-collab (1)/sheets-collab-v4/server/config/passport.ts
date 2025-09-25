import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import axios from 'axios';
import { prisma } from '../index.js';

export function setupPassport() {
  // Keycloak OAuth2 Strategy
  // console.log("--------", process.env.OIDC_AUTH_URI, process.env.OIDC_TOKEN_URI, process.env.OIDC_CLIENT_ID, process.env.OIDC_CLIENT_SECRET, process.env.OIDC_USERINFO_URI);
  passport.use('keycloak', new OAuth2Strategy({
    authorizationURL: process.env.OIDC_AUTH_URI!,
    tokenURL: process.env.OIDC_TOKEN_URI!,
    clientID: process.env.OIDC_CLIENT_ID!,
    clientSecret: process.env.OIDC_CLIENT_SECRET!,
    callbackURL: `${process.env.BASE_URL}/api/auth/keycloak/callback`,
    scope: process.env.OIDC_SCOPES!.split(' ')
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Fetch user info from Keycloak
      const response = await axios.get(process.env.OIDC_USERINFO_URI!, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const userInfo = response.data;
      console.log('Keycloak user info:', userInfo);
      
      // Extract role from Keycloak claims (adjust based on your Keycloak setup)
      let role = 'MEMBER';
      if (userInfo.realm_access?.roles?.includes('admin')) {
        role = 'ADMIN';
      } else if (userInfo.realm_access?.roles?.includes('viewer')) {
        role = 'VIEWER';
      }
      
      // Create or update user in database
      const user = await prisma.user.upsert({
        where: { email: userInfo.email },
        update: {
          name: userInfo.name || userInfo.preferred_username || userInfo.email,
          avatar: userInfo.picture,
          lastLoginAt: new Date(),
          // lastSeenAt: new Date(),
          isActive: true
        },
        create: {
          email: userInfo.email,
          name: userInfo.name || userInfo.preferred_username || userInfo.email,
          avatar: userInfo.picture,
          role: role as any,
          lastLoginAt: new Date(),
          // lastSeenAt: new Date()
        }
      });
      
      return done(null, user);
    } catch (error) {
      console.error('Keycloak authentication error:', error);
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          timezone: true,
          lastSeenAt: true
        }
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}