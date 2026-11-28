import * as authService from "../services/auth/authService.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const register = wrap(async (req, res) => {
  res.status(201).json({ data: await authService.register(req.body) });
});

export const login = wrap(async (req, res) => {
  res.json({ data: await authService.login(req.body) });
});

export const me = wrap(async (req, res) => {
  res.json({ data: await authService.getProfile(req.user.id) });
});

export const setRole = wrap(async (req, res) => {
  res.json({ data: await authService.setUserRole(req.params.id, req.body.role) });
});
