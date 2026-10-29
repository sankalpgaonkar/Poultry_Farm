/**
 * Request validation with zod. Parsed (and stripped) values replace req.body / req.params / req.query,
 * so controllers only ever see fields that were explicitly allowed.
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { validate };
