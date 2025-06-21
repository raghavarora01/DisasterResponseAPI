const users = {
  netrunnerX: { role: 'contributor' },
  reliefAdmin: { role: 'admin' }
};

const authMiddleware = (req, res, next) => {
  const userId = req.header('X-User-ID');

  if (!userId) {
    return res.status(401).json({ error: 'Missing X-User-ID header' });
  }

  const user = users[userId];

  if (!user) {
    return res.status(401).json({ error: 'Invalid user ID' });
  }

  req.user = {
    user_id: userId,
    role: user.role
  };

  next();
};
export default authMiddleware;