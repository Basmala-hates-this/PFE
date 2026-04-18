const userRepo = require('../repositories/user.repo');
const pool = require('../db');

const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (req.user.authorityLevel === 'superadmin') {
        req.currentUser = await userRepo.findById(req.user.id);
        return next();
      }

      const result = await pool.query(
        `SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission = $2`,
        [req.user.id, permission]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      req.currentUser = await userRepo.findById(req.user.id);
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = requirePermission;