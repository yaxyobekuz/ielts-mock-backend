const checkPermission = (...permissions) => {
  return (req, res, next) => {
    const user = req.user;
    if (user.role !== "teacher") return next();

    const hasAll = permissions.every(
      (key) => user.permissions && user.permissions[key]
    );
    if (!hasAll) {
      return res.status(403).json({
        code: "forbidden",
        message: "Ruxsat berilmadi",
      });
    }

    next();
  };
};

module.exports = checkPermission;
