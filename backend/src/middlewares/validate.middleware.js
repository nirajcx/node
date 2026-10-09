/** Store normalized input separately; never mutate Express 5's read-only req.query. */
export function validate(schema, source = "body") {
  if (!["body", "params", "query"].includes(source))
    throw new TypeError("Unsupported validation source");
  return (req, res, next) => {
    try {
      res.locals.validated = {
        ...res.locals.validated,
        [source]: schema.parse(req[source]),
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
