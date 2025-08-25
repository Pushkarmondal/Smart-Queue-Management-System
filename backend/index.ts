import express from 'express'
import {PrismaClient, QueueStatus} from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { authMiddleware } from './middleware';

const app = express();
const prisma = new PrismaClient();
const PORT = 3002

app.use(express.json());

app.post("/api/v1/signup", async(req, res) => {
    try {
        const {name, email, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        if(!name || !email || !password) {
            res.status(400).json({message: "All fields are required"})
        }
        const userSignup = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            },
        })
        res.status(201).json({message: "User created successfully", userSignup})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Internal Server Error"})
    }
})

app.post("/api/v1/login", async(req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            res.status(400).json({message: "All fields are required"})
        }
        const userLogin = await prisma.user.findUnique({
            where: {
                email
            }
        })
        if (!userLogin) {
            return res.status(404).json({ message: "User not found" });
          }
          const isPasswordValid = await bcrypt.compare(password, userLogin.password);
          if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
          }
      
          const token = jwt.sign(
            { 
                id: userLogin.id,
                role: userLogin.role
            },
            "secret",
            { expiresIn: "24h" }
          );
        res.status(200).json({
            message: "User logged in successfully", 
            name: userLogin.name, 
            email: userLogin.email,
            role: userLogin.role,
            token, 
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal Server Error"})
    }
})

/*
## Queues
- `GET /queues` - List all available queues
- `POST /queues` - Create a new queue (Admin only)
- `GET /queues/:id` - Get queue details
- `POST /queues/:id/join` - Join a queue
- `DELETE /queues/:id/leave` - Leave a queue
 */

app.post("/api/v1/create-queue", authMiddleware, async(req, res) => {
    try {
        const {name, location} = req.body
        if(!name || !location) {
            res.status(400).json({message: "All fields are required"})
        }
        const createQueue = await prisma.queue.create({
            data: {
                name,
                location,
                status: QueueStatus.OPEN
            }
        })
        res.status(201).json({message: "Queue created successfully", createQueue})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Internal Server Error"})
    }
})

app.get("/api/v1/queues", authMiddleware, async(req, res) => {
    try {
        const queues = await prisma.queue.findMany()
        res.status(200).json({message: "Queues fetched successfully", queues})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Internal Server Error"})
    }
})

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`)
})