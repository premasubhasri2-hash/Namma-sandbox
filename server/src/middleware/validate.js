// Express middleware: checks req.body against a Zod schema.
// On failure it sends a 400 error naming each bad field; on success it replaces
// req.body with the cleaned data.

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");
    return next(Object.assign(new Error(message), { status: 400 }));
  }
  req.body = result.data;
  next();
};