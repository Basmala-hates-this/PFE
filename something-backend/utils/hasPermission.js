const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.authorityLevel === "superadmin") return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
};

module.exports = hasPermission;