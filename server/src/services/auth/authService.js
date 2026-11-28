import mongoose from "mongoose";
import { User } from "../../models/User.js";
import { hashPassword, verifyPassword } from "./passwords.js";
import { signToken } from "./tokens.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

const publicUser = (user) => ({ id: String(user._id), name: user.name, email: user.email, role: user.role });

export async function register({ name, email, password }) {
  if (await User.exists({ email })) throw httpError(409, "An account with this email already exists");

  // Nobody can register as an admin by asking for it. The one account whose
  // email matches ADMIN_EMAIL in .env becomes the first admin.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const role = adminEmail && email === adminEmail ? "admin" : "user";

  const user = await User.create({ name, email, passwordHash: await hashPassword(password), role });
  return { user: publicUser(user), token: signToken({ id: user._id, role: user.role }) };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  // The same message for "no such email" and "wrong password", so the response
  // does not reveal which emails have accounts.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw httpError(401, "Invalid email or password");
  }
  return { user: publicUser(user), token: signToken({ id: user._id, role: user.role }) };
}

export async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw httpError(401, "Account no longer exists");
  return publicUser(user);
}

export async function setUserRole(userId, role) {
  if (!mongoose.isValidObjectId(userId)) throw httpError(400, "Invalid user id");
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
  if (!user) throw httpError(404, "User not found");
  return publicUser(user);
}
