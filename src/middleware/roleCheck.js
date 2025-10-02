import pool from '../config/database.js';

const roleCheck = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Get userId from request body or query
      const userId = req.body.userId || req.query.userId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID is required' });
      }

      // Fetch user from database
      const query = 'SELECT user_type, admin_role FROM vottery_users WHERE id = $1';
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Check if user has required role
      const userRole = user.admin_role || user.user_type;

      if (allowedRoles.length === 0) {
        // No specific roles required, just need to be authenticated
        req.user = user;
        req.userId = userId;
        return next();
      }

      if (allowedRoles.includes(userRole)) {
        req.user = user;
        req.userId = userId;
        return next();
      }

      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: userRole
      });

    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

export default roleCheck;