import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.routes";
import transactionRouter from "./routes/transaction.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRouter);
app.use("/api/transactions", transactionRouter);
// app.use("/api/categories", categoryRouter);
//TODO: add a schema for budgeting and maintain a balance for each month to track spending and other things

app.get("/", (req, res) => {
  res.send("Swagat hai expense tracker me!!");
});
app.all("*", (req, res) => {
  console.log(req.url);
  res
    .status(404)
    .send(
      `<h1>Page not found</h1><p>The page you are looking for is not found. Please check the URL and try again.</p><p>Requested URL: ${req.url}</p>`
    );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
