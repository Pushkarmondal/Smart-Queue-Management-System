import express from 'express'
import {PrismaClient} from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

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
            { id: userLogin.id },
            "secret",
            { expiresIn: "24h" }
          );
        res.status(200).json({message: "User logged in successfully", token})
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal Server Error"})
    }
})



app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`)
})