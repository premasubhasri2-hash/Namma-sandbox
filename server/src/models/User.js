import mongoose from "mongoose";

export const USER_ROLES = ["user", "operator", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // select:false keeps the hash out of every normal query result.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "user" },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
