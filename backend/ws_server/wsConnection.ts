import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const wss = new WebSocketServer({ port: 8080 });

interface ExtWebSocket extends WebSocket {
  currentUser?: {
    id: string;
    rooms: string[];
  };
}

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: number;
}

const users: User[] = [];

async function getPositionInQueue(queueId: string, userId: number): Promise<number> {
  try {
    const queueIdNum = parseInt(queueId, 10);
    if (isNaN(queueIdNum)) {
      console.error('Invalid queueId:', queueId);
      return -1;
    }
    const queueTickets = await prisma.ticket.findMany({
      where: {
        queueId: queueIdNum,
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        }
      },
      orderBy: {
        joinedAt: 'asc'
      },
      select: {
        id: true,
        userId: true,
        position: true
      }
    });
    const userTicket = queueTickets.find(ticket => ticket.userId === userId);
    return userTicket ? userTicket.position : -1;
  } catch (error) {
    console.error('Error getting queue position:', error);
    return -1;
  }
}

function broadcastToQueue(queueId: string, message: any) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && (client as ExtWebSocket).currentUser?.rooms.includes(queueId)) {
      client.send(JSON.stringify(message));
    }
  })
}

function checkUser(token: string): number | null {
  try {
    console.log('Verifying token:', token);
    const decoded = jwt.verify(token, "secret") as jwt.JwtPayload;

    console.log('Decoded token:', decoded);

    if (!decoded || typeof decoded !== 'object') {
      console.log('Invalid decoded token');
      return null;
    }

    if (!decoded.id) {
      console.log('Token missing id field');
      return null;
    }

    return decoded.id as number;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}


// ws.on("message", async (data) => {
  //   try {
  //     const message = JSON.parse(data.toString());
  //     switch(message.type) {
  //       case 'AUTH':
  //         userId = checkUser(message.token);
  //         if(!userId) {
  //           ws.send(JSON.stringify({ type: 'AUTH_ERROR' }));
  //           return;
  //         }
  //         currentUser = {
  //           ws,
  //           userId,
  //           rooms: []
  //         }
  //         users.push(currentUser);
  //         break;
        
  //       case 'JOIN_QUEUE':
  //         if(!currentUser) {
  //           return ws.send(JSON.stringify({ type: 'AUTH_ERROR' }));
  //         }
  //         if(!currentUser.rooms.includes(message.queueId)) {
  //           currentUser.rooms.push(message.queueId);
  //         }
  //         // Check if ticket already exists
  //         let ticket = await prisma.ticket.findFirst({
  //           where: { queueId: parseInt(message.queueId, 10), userId: currentUser.userId }
  //         });

  //         // If no ticket, create one
  //         if (!ticket) {
  //           console.log(`Creating ticket for user ${userId} in queue ${message.queueId}`);
  //           ticket = await prisma.ticket.create({
  //             data: {
  //               queueId: parseInt(message.queueId, 10),
  //               userId: currentUser.userId,
  //               status: "OPEN",
  //               joinedAt: new Date()
  //             }
  //           });
  //         }

  //         // Get updated position
  //         const position = await getPositionInQueue(message.queueId, currentUser.userId);
  //         ws.send(JSON.stringify({
  //           type: 'POSITION_UPDATE',
  //           queueId: message.queueId,
  //           position
  //         }));
  //         broadcastToQueue(message.queueId, {
  //           type: 'POSITION_UPDATE',
  //           queueId: message.queueId,
  //           position,
  //           message: `User ${userId} joined the queue`
  //         });
  //         break;
  //     }
  //   } catch(error) {
  //     console.error('Error handling message:', error);
  //     ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
  //   }
  // });

  // ws.on('close', () => {
  //   console.log('Client disconnected');
  //   if (currentUser) {
  //     const index = users.findIndex(u => u.userId === currentUser?.userId);
  //     if (index !== -1) {
  //       users.splice(index, 1);
  //     }
  //   }
  // });

  wss.on("connection", function connection(ws: ExtWebSocket) {
    let userId: number | null = null;
    let currentUser: User | null = null;
  
    ws.on("error", console.error);
    console.log("Client connected");
  
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "AUTH":
            userId = checkUser(message.token);
            if (!userId) {
              ws.send(JSON.stringify({ type: "AUTH_ERROR" }));
              return;
            }
  
            currentUser = {
              ws,
              userId,
              rooms: [],
            };
            users.push(currentUser);
  
            // 🔑 attach metadata to the WebSocket
            ws.currentUser = {
              id: String(userId),
              rooms: [],
            };
            break;
  
          case "JOIN_QUEUE":
            if (!currentUser || !userId) {
              return ws.send(JSON.stringify({ type: "AUTH_ERROR" }));
            }
  
            // Add room both to currentUser and ws.currentUser
            if (!currentUser.rooms.includes(message.queueId)) {
              currentUser.rooms.push(message.queueId);
            }
            if (!ws.currentUser?.rooms.includes(message.queueId)) {
              ws.currentUser?.rooms.push(message.queueId);
            }
  
            // Ensure ticket exists
            let ticket = await prisma.ticket.findFirst({
              where: { queueId: parseInt(message.queueId, 10), userId: currentUser.userId },
            });
  
            if (!ticket) {
              console.log(`Creating ticket for user ${userId} in queue ${message.queueId}`);
              ticket = await prisma.ticket.create({
                data: {
                  queueId: parseInt(message.queueId, 10),
                  userId: currentUser.userId,
                  status: "OPEN",
                  joinedAt: new Date(),
                },
              });
            }
  
            // Get updated position
            const position = await getPositionInQueue(message.queueId, currentUser.userId);
  
            // Send to current user
            ws.send(
              JSON.stringify({
                type: "POSITION_UPDATE",
                queueId: message.queueId,
                position,
              })
            );
  
            // 🔊 Broadcast to all users in queue
            broadcastToQueue(message.queueId, {
              type: "POSITION_UPDATE",
              queueId: message.queueId,
              position,
              message: `User ${userId} joined the queue`,
            });
            break;
        }
      } catch (error) {
        console.error("Error handling message:", error);
        ws.send(JSON.stringify({ type: "ERROR", message: "Invalid message format" }));
      }
    });
  
    ws.on("close", () => {
      console.log("Client disconnected");
      if (currentUser) {
        const index = users.findIndex((u) => u.userId === currentUser?.userId);
        if (index !== -1) {
          users.splice(index, 1);
        }
      }
    });
});

