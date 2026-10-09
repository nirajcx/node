# Application source

`server.js` owns process startup and infrastructure shutdown. `app.js` builds an injectable Express app without opening a socket. Feature code lives in routes, validators, controllers, services and repositories.

Follow the dependency direction in [architecture](../docs/ARCHITECTURE.md). Avoid circular imports and module-level database connections. Use the shared response/error helpers rather than introducing a second response format.
