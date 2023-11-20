import express from "express";
import mysql from "mysql";
import cors from "cors";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { Server } from "socket.io";
import { createServer } from "node:http";

const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(cors());
app.use(express.json());

//default port
let defaultPort = "COM4";

// Endpoint to set the COM port manually
app.post("/setComPort", (req, res) => {
  const { port } = req.body;
  console.log(`Received request to set COM port to ${port}`);
  defaultPort = port;
  res.json({ message: `COM port set to ${port}` });
});

//koneksi socket io
io.on("connection", (socket) => {
  console.log("connected...");
  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});

// Koneksi serial arduino
const port = new SerialPort({
  path: defaultPort, // Use the default COM port initially
  baudRate: 19200,
});

// Parsing data dari arduino
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

// Tangkap data dari arduino
parser.on("data", (result) => {
  console.log("data dari arduino ->", result);
  io.emit("data", { data: result });
});

//komunikasi data
app.post("/arduinoApi", (req, res) => {
  const data = req.body.data;
  port.write(data, (err) => {
    if (err) {
      console.log("err: ", err);
      res.status(500).json({ error: "write data error" });
    }
    console.log("data terkirim ->", data);
    res.end();
  });
});

//CRUD
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bp_app",
});

app.get("/", (req, res) => {
  const sql = "SELECT * FROM customers";
  db.query(sql, (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

app.post("/customers", (req, res) => {
  const sql =
    "INSERT INTO customers (`customer_name`,`project_name`,`project_address`,`telp_no`,`volume`) VALUES (?)";
  const values = [
    req.body.customer_name,
    req.body.project_name,
    req.body.project_address,
    req.body.telp_no,
    req.body.volume,
  ];
  db.query(sql, [values], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

app.get("/read-customers/:id", (req, res) => {
  const sql = "SELECT * FROM customers WHERE id = ?";
  const id = req.params.id;
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

app.put("/update-customers/:id", (req, res) => {
  const sql =
    "UPDATE customers SET `customers_name` = ? , `project_name` = ? , `project_address` = ? , `telp_no` = ? , `volume` = ? WHERE id = ?";
  const id = req.params.id;
  db.query(
    sql,
    [
      req.body.customer_name,
      req.body.project_name,
      req.body.project_address,
      req.body.telp_no,
      req.body.volume,
      id,
    ],
    (err, result) => {
      if (err) return res.json({ message: "Error inside server" });
      return res.json(result);
    }
  );
});

// listen to localhost:5000
app.listen(5000, () => {
  console.log("server on");
});
