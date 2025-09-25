import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Initiate Keycloak login
router.get('/keycloak', passport.authenticate('keycloak'));

// Keycloak callback
router.get('/keycloak/callback', 
  passport.authenticate('keycloak', { failureRedirect: `${process.env.BASE_URL}/login?error=auth_failed` }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user.id, 
          email: req.user.email,
          role: req.user.role
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      // Redirect to frontend with token
      res.redirect(`${process.env.BASE_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${process.env.BASE_URL}/login?error=token_generation_failed`);
    }
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.json({ success: true });
    });
  });
});

// Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    avatar: req.user.avatar,
    role: req.user.role,
    timezone: req.user.timezone,
    lastSeenAt: req.user.lastSeenAt
  });
});

// Refresh token
router.post('/refresh', authMiddleware, (req: AuthRequest, res) => {
  try {
    const token = jwt.sign(
      { 
        userId: req.user.id, 
        email: req.user.email,
        role: req.user.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

export { router as authRoutes };