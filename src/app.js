import express from 'express';
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.get('/', (req, res) => {
    const name = process.env.NAME || 'World - v1.0.1';
    res.send(`Hello ${name}!`);
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
    console.log(`edival-api: listening on port ${port}`);
});