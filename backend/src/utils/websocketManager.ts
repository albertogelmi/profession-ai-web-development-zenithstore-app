import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { JwtBlacklistService } from "../services/JwtBlacklistService";
import { UserRepository } from "../repositories/mysql/UserRepository";
import { errorEmitter } from "./errorEmitter";

interface AuthenticatedSocket extends SocketIOServer {
  userId?: string;
  userRole?: string;
}

export interface OrderPaidEventData {
  orderId: number;
  customerId: number;
  customerName: string;
  totalAmount: number;
  paymentDate: Date;
  paymentProvider: string;
  transactionId: string;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private jwtBlacklistService: JwtBlacklistService;
  private userRepository: UserRepository;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.jwtBlacklistService = new JwtBlacklistService();
    this.userRepository = new UserRepository();

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  /**
   * Setup JWT authentication for WebSocket connections
   * Supports both technical users and customers
   */
  private setupAuthentication(): void {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error("Authentication required"));
        }

        // Check if token is blacklisted
        const isBlacklisted = await this.jwtBlacklistService.isTokenBlacklisted(token);
        if (isBlacklisted) {
          return next(new Error("Token is no longer valid"));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Determine if it's a technical user or customer based on payload
        if (decoded.userId && decoded.role === "user") {
          // Technical user authentication
          const user = await this.userRepository.findById(decoded.userId);
          if (!user || !user.isActive || user.isBlocked) {
            return next(new Error("User account is no longer active"));
          }

          socket.userId = decoded.userId;
          socket.userRole = "user";
          socket.username = `${user.firstName} ${user.lastName}`.trim();
          socket.userType = "technical";
        } else if (decoded.userId && decoded.role === "customer") {
          // Customer authentication
          socket.customerId = decoded.userId.toString();
          socket.userRole = "customer";
          socket.userType = "customer";
          socket.username = decoded.email || `Customer ${decoded.userId}`;
        } else {
          return next(new Error("Invalid token format"));
        }

        next();
      } catch (error) {
        errorEmitter.emitBusinessError(error as Error, {
          path: "WebSocketManager.authentication",
        });
        next(new Error("Authentication failed"));
      }
    });
  }

  /**
   * Setup WebSocket event handlers
   * Supports both technical users and customers with room strategy
   */
  private setupEventHandlers(): void {
    this.io.on("connection", (socket: any) => {
      if (socket.userType === "technical") {
        // Technical user connection
        console.info(`🔌 Technical user connected: ${socket.username} (${socket.id})`);
        socket.join("technical-users");

        socket.on("disconnect", (reason: string) => {
          console.info(`🔌 Technical user disconnected: ${socket.username} (${socket.id}) - Reason: ${reason}`);
        });
      } else if (socket.userType === "customer") {
        // Customer connection
        console.info(`🔌 Customer connected: ${socket.username} (ID: ${socket.customerId}, Socket: ${socket.id})`);
        
        // Join customer-specific room and all-customers room
        socket.join(`customer-${socket.customerId}`);
        socket.join("all-customers");

        socket.on("disconnect", (reason: string) => {
          console.info(`🔌 Customer disconnected: ${socket.username} (ID: ${socket.customerId}, Socket: ${socket.id}) - Reason: ${reason}`);
        });
      }

      // Handle ping for keep-alive (both user types)
      socket.on("ping", () => {
        socket.emit("pong", { timestamp: new Date().toISOString() });
      });
    });

    console.info("🔌 WebSocket server initialized with authentication for technical users and customers");
  }

  /**
   * Emit order paid event to all connected technical users and the customer who made the order
   */
  public emitOrderPaidEvent(eventData: OrderPaidEventData): void {
    try {
      const payload = {
        type: "order.paid",
        timestamp: new Date().toISOString(),
        data: {
          orderId: eventData.orderId,
          customerId: eventData.customerId,
          customerName: eventData.customerName,
          totalAmount: eventData.totalAmount,
          paymentDate: eventData.paymentDate,
          paymentProvider: eventData.paymentProvider,
          transactionId: eventData.transactionId,
        },
      };

      // Emit to all technical users
      this.io.to("technical-users").emit("order.paid", payload);

      // Emit to the specific customer who made the order
      this.emitToCustomer(eventData.customerId.toString(), "order.paid", payload);

      console.info(`🔔 Order paid event emitted to technical users and customer ${eventData.customerId} - Order ID: ${eventData.orderId}`);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "WebSocketManager.emitOrderPaidEvent",
      });
    }
  }

  /**
   * Emit event to a specific technical user by userId
   * Backward compatible method for technical users
   */
  public emitToSpecificUser(userId: string, eventType: string, payload: any): void {
    try {
      // Find socket(s) for the specific user
      const sockets = Array.from(this.io.sockets.sockets.values());
      const userSockets = sockets.filter((socket: any) => socket.userId === userId);

      if (userSockets.length > 0) {
        userSockets.forEach((socket) => {
          socket.emit(eventType, payload);
        });
        console.info(`🔔 Event '${eventType}' emitted to user ${userId} (${userSockets.length} connections)`);
      } else {
        console.info(`⚠️ User ${userId} not connected - event '${eventType}' not delivered`);
      }
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "WebSocketManager.emitToSpecificUser",
      });
    }
  }

  /**
   * Emit event to a specific customer by customerId
   * @param customerId - Customer ID
   * @param eventType - Event type (e.g., 'notification')
   * @param payload - Event payload
   */
  public emitToCustomer(customerId: string, eventType: string, payload: any): void {
    try {
      const room = `customer-${customerId}`;
      this.io.to(room).emit(eventType, payload);
      
      // Check if customer is connected
      this.io.in(room).allSockets().then((sockets) => {
        if (sockets.size > 0) {
          console.info(`🔔 Event '${eventType}' emitted to customer ${customerId} (${sockets.size} connections)`);
        } else {
          console.info(`⚠️ Customer ${customerId} not connected - event '${eventType}' not delivered`);
        }
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "WebSocketManager.emitToCustomer",
      });
    }
  }

  /**
   * Emit event to all connected customers (broadcast)
   * @param eventType - Event type (e.g., 'notification', 'offer')
   * @param payload - Event payload
   */
  public emitToAllCustomers(eventType: string, payload: any): void {
    try {
      this.io.to("all-customers").emit(eventType, payload);
      
      // Get count of connected customers
      this.io.in("all-customers").allSockets().then((sockets) => {
        console.info(`🔔 Event '${eventType}' broadcasted to all customers (${sockets.size} connections)`);
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "WebSocketManager.emitToAllCustomers",
      });
    }
  }

  /**
   * Emit event to all connected technical users
   * @param eventType - Event type
   * @param payload - Event payload
   */
  public emitToTechnicalUsers(eventType: string, payload: any): void {
    try {
      this.io.to("technical-users").emit(eventType, payload);
      
      // Get count of connected technical users
      this.io.in("technical-users").allSockets().then((sockets) => {
        console.info(`🔔 Event '${eventType}' emitted to technical users (${sockets.size} connections)`);
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "WebSocketManager.emitToTechnicalUsers",
      });
    }
  }

  /**
   * Get number of connected technical users
   */
  public getConnectedUsersCount(): Promise<number> {
    return new Promise((resolve) => {
      this.io.in("technical-users").allSockets().then((sockets) => {
        resolve(sockets.size);
      });
    });
  }

  /**
   * Get number of connected customers
   */
  public getConnectedCustomersCount(): Promise<number> {
    return new Promise((resolve) => {
      this.io.in("all-customers").allSockets().then((sockets) => {
        resolve(sockets.size);
      });
    });
  }

  /**
   * Get WebSocket server instance
   */
  public getServer(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let websocketManager: WebSocketManager | null = null;

export const initializeWebSocketManager = (server: HttpServer): WebSocketManager => {
  if (websocketManager) {
    throw new Error("WebSocket manager already initialized");
  }
  websocketManager = new WebSocketManager(server);
  return websocketManager;
};

export const getWebSocketManager = (): WebSocketManager => {
  if (!websocketManager) {
    throw new Error("WebSocket manager not initialized");
  }
  return websocketManager;
};