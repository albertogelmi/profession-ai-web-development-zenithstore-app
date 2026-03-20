import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import path from "path";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";
import { mongoDBConnection } from "./config/mongodb";
import { initializeWebSocketManager } from "./utils/websocketManager";

// Middleware imports
import { corsMiddleware, helmetMiddleware } from "./middleware/security";
import { accessLogger, captureResponseBody } from "./middleware/logging";
import { apiLimiter } from "./middleware/rateLimiter";
import { activityLogger } from "./middleware/activityLogger";
import {
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers,
} from "./middleware/errorHandler";

// Routes imports
import { createUserRoutes } from "./routes/userRoutes";
import { createProductRoutes } from "./routes/productRoutes";
import { createCategoryRoutes } from "./routes/categoryRoutes";
import { createCustomerRoutes } from "./routes/customerRoutes";
import { createOrderRoutes } from "./routes/orderRoutes";
import { createPaymentRoutes } from "./routes/paymentRoutes";
import { createShipmentRoutes } from "./routes/shipmentRoutes";
import { createReviewRoutes } from "./routes/reviewRoutes";
import { createQuestionRoutes } from "./routes/questionRoutes";
import { createWishlistRoutes } from "./routes/wishlistRoutes";
import { createNotificationRoutes } from "./routes/notificationRoutes";
import { getScheduler } from "./jobs/scheduler";
import { register as metricsRegister, httpRequestMiddleware } from "./middleware/metrics";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Setup global error handlers
setupGlobalErrorHandlers();

// Logging middleware
app.use(accessLogger);
app.use(captureResponseBody);

// Security middleware
app.use(helmetMiddleware);

// Rate limiting
app.use("/api/", apiLimiter);

// Body parsing middleware
// Increase body size limits for JSON and URL-encoded
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Activity logging middleware
app.use(activityLogger);

// Prometheus metrics timing middleware
app.use(httpRequestMiddleware);

// Start server
const startServer = async () => {
  try {
    // Initialize MySQL database connection
    await AppDataSource.initialize();
    console.info("📊 MySQL Database connected successfully");

    // Initialize MongoDB connection
    await mongoDBConnection.connect();
    console.info("📊 MongoDB connected successfully");

    // Initialize WebSocket manager
    const websocketManager = initializeWebSocketManager(server);
    console.info("🔌 WebSocket manager initialized");

    // Start background job scheduler
    const scheduler = getScheduler();
    scheduler.start();
    console.info("⏰ Job scheduler started");

    // Create user routes
    const userRoutes = createUserRoutes();
    app.use("/api/users", userRoutes);

    // Create customer routes
    const customerRoutes = createCustomerRoutes();
    app.use("/api/customers", customerRoutes);

    // Create review routes (MongoDB) - BEFORE product routes to avoid conflicts
    const reviewRoutes = createReviewRoutes();
    app.use("/api", reviewRoutes);

    // Create question routes (MongoDB) - BEFORE product routes to avoid conflicts
    const questionRoutes = createQuestionRoutes();
    app.use("/api", questionRoutes);

    // Create product routes
    const productRoutes = createProductRoutes();
    app.use("/api/products", productRoutes);

    // Create category routes
    const categoryRoutes = createCategoryRoutes();
    app.use("/api/categories", categoryRoutes);

    // Create order routes
    const orderRoutes = createOrderRoutes();
    app.use("/api/orders", orderRoutes);

    // Create payment routes
    const paymentRoutes = createPaymentRoutes();
    app.use("/api/payments", paymentRoutes);

    // Create shipment routes
    const shipmentRoutes = createShipmentRoutes();
    app.use("/api/shipments", shipmentRoutes);

    // Create wishlist routes
    const wishlistRoutes = createWishlistRoutes();
    app.use("/api/wishlist", wishlistRoutes);

    // Create notification routes
    const notificationRoutes = createNotificationRoutes();
    app.use("/api/notifications", notificationRoutes);

    // Basic route
    app.get("/", corsMiddleware, (req, res) => {
      res.json({
        message: "🚀 ZenithStore Online API",
        version: "1.0.0",
        status: "active",
        timestamp: new Date().toISOString(),
        endpoints: {
          health: "/health",
          users: "/api/users",
          customers: "/api/customers",
          products: "/api/products",
          categories: "/api/categories",
          orders: "/api/orders",
          payments: "/api/payments",
          shipments: "/api/shipments",
          wishlist: "/api/wishlist",
          notifications: "/api/notifications",
          reviews: "/api/reviews",
          questions: "/api/questions",
          docs: "/api/docs",
          dashboard: "/user-interface",
          notificationDashboard: "/user-interface/notification",
          ordersDashboard: "/user-interface/orders",
          promotionsDashboard: "/user-interface/promotions",
        },
      });
    });

    // User interface page
    app.get("/user-interface", corsMiddleware, (req, res) => {
      res.sendFile(path.join(__dirname, "pages", "user-interface.html"));
    });

    app.get("/user-interface/notification", corsMiddleware, (req, res) => {
      res.sendFile(path.join(__dirname, "pages", "notification.html"));
    });

    app.get("/user-interface/orders", corsMiddleware, (req, res) => {
      res.sendFile(path.join(__dirname, "pages", "orders.html"));
    });

    app.get("/user-interface/promotions", corsMiddleware, (req, res) => {
      res.sendFile(path.join(__dirname, "pages", "promotions.html"));
    });

    // Health check endpoint
    app.get("/health", corsMiddleware, async (req, res) => {
      const connectedUsers = await websocketManager.getConnectedUsersCount();
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        database: "connected",
        websocket: {
          status: "active",
          connectedTechnicalUsers: connectedUsers,
        },
        memory: {
          used:
            Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
          total:
            Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
        },
      });
    });

    // API documentation endpoint
    app.get("/api/docs", corsMiddleware, (req, res) => {
      try {
        const apiDocs = require('./docs/api-documentation.json');
        res.json(apiDocs);
      } catch (error) {
        console.error('Error loading API documentation:', error);
        res.status(500).json({
          success: false,
          message: "API documentation not available",
          error: "Documentation file not found"
        });
      }
    });

    // API documentation in OpenAPI/Swagger format
    app.get("/api/openapi", corsMiddleware, (req, res) => {
      try {
        const apiDocs = require('./docs/api-documentation.json');
        res.setHeader('Content-Type', 'application/json');
        res.json(apiDocs);
      } catch (error) {
        console.error('Error loading OpenAPI documentation:', error);
        res.status(500).json({
          success: false,
          message: "OpenAPI documentation not available"
        });
      }
    });

    // Prometheus metrics endpoint (scraped by Prometheus every 15s)
    app.get("/metrics", async (_req, res) => {
      res.set("Content-Type", metricsRegister.contentType);
      res.end(await metricsRegister.metrics());
    });

    // 404 handler
    app.use(notFoundHandler);

    // Error handler
    app.use(errorHandler);

    server.listen(PORT, () => {
      console.info(`🚀 Server is running on port ${PORT}`);
      console.info(`📍 API URL: http://localhost:${PORT}`);
      console.info(`🔌 WebSocket URL: ws://localhost:${PORT}`);
      console.info(`🧪 Dashboard: http://localhost:${PORT}/user-interface`);
      console.info(`🔔 Notifications: http://localhost:${PORT}/user-interface/notification`);
      console.info(`📦 Orders Management: http://localhost:${PORT}/user-interface/orders`);
      console.info(`� Promotions: http://localhost:${PORT}/user-interface/promotions`);
      console.info(`�🏥 Health check: http://localhost:${PORT}/health`);
      console.info(`📚 API docs: http://localhost:${PORT}/api/docs`);
      console.info(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    
    // Cleanup on error
    try {
      await mongoDBConnection.disconnect();
      await AppDataSource.destroy();
    } catch (cleanupError) {
      console.error("❌ Error during cleanup:", cleanupError);
    }
    
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.info('⚠️ SIGTERM signal received: closing HTTP server');
  
  // Stop background jobs
  const scheduler = getScheduler();
  scheduler.stop();
  console.info('⏰ Job scheduler stopped');
  
  server.close(async () => {
    console.info('🔌 HTTP server closed');
    
    try {
      await mongoDBConnection.disconnect();
      await AppDataSource.destroy();
      console.info('📊 Database connections closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
});

startServer();
