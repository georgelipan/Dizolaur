import { Server } from 'socket.io';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { loadConfig } from './config/index.js';
import { MatchManager } from './services/MatchManager.js';
import { PlatformIntegration } from './services/PlatformIntegration.js';
import { SocketHandler } from './handlers/SocketHandler.js';

/**
 * Main entry point for the game server
 */
async function main() {
  console.log('🦖 Dino Game Server starting...');

  // Load configuration
  const config = loadConfig();
  console.log(`📝 Configuration loaded`);
  console.log(`   - Port: ${config.port}`);
  console.log(`   - Max Players: ${config.gameConfig.maxPlayers}`);
  console.log(`   - Tick Rate: ${config.gameConfig.tickRate}ms`);

  // Create HTTP server with basic request handler for health checks
  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    // Health check endpoint for Render
    if (req.url === '/' || req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        service: 'Dino Game Backend',
        timestamp: Date.now() 
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log('🔌 Socket.IO initialized');

  // Initialize services
  const matchManager = new MatchManager(config.gameConfig);
  const platformIntegration = new PlatformIntegration(
    config.platformCallbackUrl,
    config.platformApiKey
  );

  console.log('⚙️  Services initialized');

  // Initialize socket handler
  const socketHandler = new SocketHandler(
    io,
    matchManager,
    platformIntegration
  );
  socketHandler.initialize();

  console.log('🎮 Socket handlers registered');

  // Start game loop (updates all active matches)
  const gameLoopInterval = setInterval(() => {
    matchManager.updateAllMatches();
  }, config.gameConfig.tickRate);

  console.log('🔄 Game loop started');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('💤 SIGTERM received, shutting down gracefully...');
    clearInterval(gameLoopInterval);
    httpServer.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('💤 SIGINT received, shutting down gracefully...');
    clearInterval(gameLoopInterval);
    httpServer.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  // Start listening
  httpServer.listen(config.port, config.host, () => {
    console.log(`\n🚀 Server running on ${config.host}:${config.port}`);
    console.log(`   Socket.IO endpoint: ws://${config.host}:${config.port}`);
    console.log('\n✅ Ready to accept connections!\n');
  });
}

// Start the server
main().catch((error) => {
  console.error('❌ Fatal error during startup:', error);
  process.exit(1);
});
