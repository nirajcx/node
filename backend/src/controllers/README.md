# Controllers — learning layer

`auth.controller.js` will translate authentication service results into safe user responses and cookies. `todo.controller.js` will translate todo service results into documented HTTP statuses.

Read sanitized values from `res.locals.validated`; authenticated ownership comes from `req.user`. Call services and return `sendSuccess(res, { status, message, data })`. Use a 201 for create/register and a 200 with null data for logout/delete.

Do not put SQL, password hashing or business decisions in controllers. Allow async errors to reach Express 5's error middleware. Never wrap an already-sent response with another response. Never expose repository rows containing password/session hashes.

Acceptance: controller integration tests verify status, envelope, cookie options and error delegation.
