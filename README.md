# Women Empowerment Multi-Service Platform — Backend

Node.js + Express + MySQL (XAMPP) API connecting home-based women providers (homemade food, handmade products, household services) with customers.

Requirements, database design (from the ERD) and the endpoint list: [docs/requirements.md](docs/requirements.md)

## Run (with XAMPP)
1. In the XAMPP Control Panel, start **Apache** and **MySQL**.
2. Open http://localhost/phpmyadmin → **Import** → choose `database/women_platform.sql` → **Import**.
   This creates the `women_platform` database, its 16 tables and demo data.
3. `npm install`
4. Copy `.env.example` to `.env`. The default `DATABASE_URL=mysql://root:@localhost:3306/women_platform` works with
   a fresh XAMPP (user `root`, no password). If your root has a password, put it after `root:`.
5. `npm run dev` (auto-reload) or `npm start` → `http://localhost:3000/api/health`

Skipped step 2? Create an empty `women_platform` database in phpMyAdmin: the server creates the tables on start,
and `npm run seed` loads the demo data (it wipes the tables first).

Demo accounts (password `password123`): admin@example.com, mona@example.com (provider), sara@example.com (customer), and more in `src/db/seed.sql`.

**Admin accounts:** register with `"user_type": "admin"` and `"admin_secret"` equal to `ADMIN_SECRET` in `.env`.
**Providers** must be accepted by an admin (`PATCH /api/providers/:id/verification`) before they can sell.

## Test
- `npm test` runs the full flow against MySQL. It needs XAMPP's MySQL running; it creates a throwaway database
  `women_platform_test` and drops it at the end, so your real data is never touched.
- Postman: import `postman_collection.json` and run it with the Collection Runner (folders in order). It saves tokens and ids automatically. `adminSecret` must match `ADMIN_SECRET`. Skip "11. Cleanup" to keep the data.

## Structure
Organised by feature: each folder in `src/modules` holds that feature's routes (URLs), controller (request handling)
and model (SQL).
```
index.js                 starts the server (creates tables first)
database/
  women_platform.sql     the phpMyAdmin import file (schema + demo data)
src/
  app.js                 Express setup, mounts every module's routes
  db/
    connection.js        MySQL pool, query helpers, transactions
    schema.sql           16 tables + constraints (the ERD)
    seed.sql, seed.js    demo data (npm run seed)
  middleware/
    auth.middleware.js   JWT check, role check, verified-provider check
    error.middleware.js  turns errors into JSON + status codes
    not-found.middleware.js
  core/
    Model.js             parent class of every model: findAll, findById, create, update, remove
    Controller.js        parent class of every controller: list, get, create, update, remove
  modules/
    auth/                register, login, me
    user/                users + customers
    address/
    category/
    provider/            service providers + admin verification
    document/            verification documents
    item/                food, craft and service models; one shared routes + controller for all three
    slot/                appointment slots
    order/               orders + order items
    payment/
    review/
    chat/                conversations + messages
test/api.test.js         end-to-end test
docs/requirements.md     requirements + database design + endpoints
postman_collection.json
```

### Adding a new CRUD table
1. Add the table to `src/db/schema.sql`.
2. Model: `class XModel extends Model { constructor() { super('x_table', 'x_id', ['col1', 'col2']); } }`, then `module.exports = new XModel();`
3. Controller: `module.exports = new Controller(X, 'X');` (or extend `Controller` and override a method for extra rules).
4. Routes: copy `category.routes.js`, then mount it in `src/app.js`.

If you change `src/db/schema.sql` or `src/db/seed.sql`, rebuild the import file so they stay in sync.

# women-empowrment
