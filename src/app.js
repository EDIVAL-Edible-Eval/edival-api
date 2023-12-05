import dotenv from "dotenv";
import express from 'express';
import userRoutes from './routes/userRoutes.js'
import reminderRoutes from './routes/reminderRoutes.js'
import genAIRoutes from './routes/genAIRoutes.js'

dotenv.config();

const app = express();
app.locals.siteTitle = 'EDIVAL API'

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw( {type: ["image/jpeg", "image/jpg", "image/png", "image/gif"], limit: "5mb"} ))

app.use('/user', userRoutes)
app.use('/reminder', reminderRoutes)
app.use('/gen-ai', genAIRoutes); 
app.get('/', (req, res) => {
    const name = process.env.NAME || 'World';
    res.send(`Hello ${name}! Edival API is RUNNING`);
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
    console.log(`edival-api: listening on port ${port}`);
});
