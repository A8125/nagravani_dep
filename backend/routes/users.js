import { Router } from 'express';
import { v4 as uuid } from 'uuid';

const router = Router();

// Mock user since we didn't migrate users to Supabase yet
const MOCK_USER = {
  id: 'user-seed',
  name: 'Demo Citizen',
  phone: '9999900000',
  email: 'demo@nagaravaani.in',
  lang: 'en',
  points: 120,
  badge: 'City Guardian'
};

router.post('/register', (req, res) => {
  res.status(201).json({ success: true, user: MOCK_USER, message: 'Welcome to NagaraVaani!' });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      profile: MOCK_USER,
      my_complaints: [],
      upvoted_issues: [],
      status_breakdown: { Pending: 0, InProgress: 0, Resolved: 0 },
      contributions: 5,
    },
  });
});

router.get('/:id/notifications', (req, res) => {
  res.json({ success: true, data: [] });
});

router.patch('/:id/lang', (req, res) => {
  res.json({ success: true, lang: req.body.lang });
});

export default router;
