import { createServer } from 'http';
import { connectDB } from './database';
import { logger } from './lib/logger';

const PORT = 3000;

interface User {
  id: string;
  name: string;
  email: string;
}

const users: User[] = [];

async function startServer() {
  await connectDB();
  logger.info('Database connected');

  const server = createServer((req, res) => {
    if (req.url === '/api/users' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(users));
      return;
    }

    if (req.url?.startsWith('/api/users/') && req.method === 'GET') {
      const id = req.url.split('/')[3];
      const user = users.find(u => u.id === id);
      if (!user) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
