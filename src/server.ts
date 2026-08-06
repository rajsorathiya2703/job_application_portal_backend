import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import dns from "dns";

dns.setServers(['1.1.1.1', '8.8.8.8'])

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
