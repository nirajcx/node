# Routes

`auth.routes.js`: register, login, current user and logout.
`todo.routes.js`: list, create, patch and delete todos.

All feature handlers currently return the shared 501 error. Replace stubs only after implementing their controllers and security gates.

Target order: request-level security → rate limiter → authentication where required → params/body validation → controller. Protect the entire todo router with `requireAuth` before registering its routes. Place not-found and error handlers after routers in app.js.

Do not write SQL, construct a pool or hash passwords here. The exact route contract is in [API.md](../../docs/API.md).
