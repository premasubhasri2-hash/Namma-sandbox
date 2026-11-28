// Role check. Use it AFTER authenticate: authenticate says who you are,
// requireRole says whether that person is allowed to do this.

export const requireRole =
  (...allowed) =>
  (req, res, next) => {
    if (!req.user) {
      return next(Object.assign(new Error("Please sign in first"), { status: 401 }));
    }
    if (!allowed.includes(req.user.role)) {
      return next(Object.assign(new Error("You do not have permission to do this"), { status: 403 }));
    }
    next();
  };
