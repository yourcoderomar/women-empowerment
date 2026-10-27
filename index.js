const app = require('./src/app');
const { init } = require('./src/db/connection');

const { PORT = 3000 } = process.env;
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  throw new Error('JWT_SECRET and DATABASE_URL must be set (copy .env.example to .env)');
}

init().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
