const userRepo = require("../repositories/user.repo");
const hasPermission = require("../utils/hasPermission");

const requirePermission = (permission) => {
  return (req, res, next) => {
    const user = userRepo.findById(req.user.id);

    if (!hasPermission(user, permission)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.currentUser = user; // reuse later
    next();
  };
};

module.exports = requirePermission;