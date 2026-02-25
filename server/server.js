import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import prisma from './configs/prisma.js';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Health check route
app.get('/', (req, res) => res.send('Server is live!'));

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ message: 'Database connected successfully!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  } finally {
    await prisma.$disconnect();
  }
});

// Test Prisma operations
app.get('/test-prisma', async (req, res) => {
  try {
    // Test creating a user
    const testUser = await prisma.user.create({
      data: {
        id: `test_${Date.now()}`,
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
      },
    });

    // Test querying users
    const users = await prisma.user.findMany({
      take: 5,
    });

    res.json({ 
      message: 'Prisma operations successful!',
      createdUser: testUser,
      totalUsers: users.length,
      users: users.map(u => ({ id: u.id, name: u.name, email: u.email }))
    });
  } catch (error) {
    console.error('Prisma operation error:', error);
    res.status(500).json({ error: 'Prisma operation failed', details: error.message });
  }
});

app.use("/api/inngest", serve({ client: inngest, functions }));

const PORT = process.env.PORT || 5000;

// Start server with proper error handling
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
