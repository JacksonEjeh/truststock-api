import express from "express";
import { config } from "./configs/config.js";
import cors from "cors";
import connectDataBase from "./configs/dbConnect.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const port = config.port || 5000;

// connect to Database
connectDataBase();

//Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

const allowedOrigins = process.env?.ALLOWED_ORIGINS?.split(",");

app.use(cors({
    origin: (origin, callback) => {
        if(!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true                // Allow cookies to be sent
}));
app.use(cookieParser());

//Routes
app.get("/", (req, res)=>{
    res.send("Welcome to my Truststock API");
});
app.use("/api/v1/auth", authRoutes);

//Global Error Handler
app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    if(err.name === "ValidationError"){
        statusCode = 400;
        message = Object.values(err.errors).map((val)=> val.message).join(", ");
    }
    if(err.code === 11000){
        statusCode = 400;
        message = "Duplicate value entered"
    }
    if (err.name === "MongoError") {
        statusCode = 500;
        message = "Database error occurred.";
    }

    if (err.name === "ConnectionTimeout") {
        statusCode = 408;
        message = "Connection timeout.";
    }

    if (process.env.NODE_ENV === "development") {
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})