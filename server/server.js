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
  const result = req.body.result;
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

//GET

//customers
app.get("/", (req, res) => {
  const sql = "SELECT * FROM customers";
  db.query(sql, (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

//trucks
app.get("/tr", (req, res) => {
  const sql = "SELECT * FROM trucks";
  db.query(sql, (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

//drivers
app.get("/dr", (req, res) => {
  const sql = "SELECT * FROM drivers";
  db.query(sql, (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

//materials
app.get("/ma", (req, res) => {
  const sql = "SELECT * FROM materials";
  db.query(sql, (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

//POST

//customers
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

//trucks
app.post("/trucks", (req, res) => {
  const sql = "INSERT INTO trucks (`no_truck`) VALUES (?)";
  const values = [req.body.no_truck];
  db.query(sql, [values], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

//drivers
app.post("/drivers", (req, res) => {
  const sql = "INSERT INTO drivers (`driver_name`) VALUES (?)";
  const values = [req.body.driver_name];
  db.query(sql, [values], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

//materials
app.post("/materials", (req, res) => {
  const sql = "INSERT INTO materials (`material_name`, `price_kg`) VALUES (?)";
  const values = [req.body.material_name, req.body.price_kg];
  db.query(sql, [values], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

//DELETE

//customers
app.delete("/delete-customers/:id", (req, res) => {
  const sql = "DELETE FROM customers WHERE ID=?";
  const id = req.params.id;
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

//trucks
app.delete("/delete-trucks/:id", (req, res) => {
  const sql = "DELETE FROM trucks WHERE ID=?";
  const id = req.params.id;
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

//drivers
app.delete("/delete-drivers/:id", (req, res) => {
  const sql = "DELETE FROM drivers WHERE ID=?";
  const id = req.params.id;
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

//materials
app.delete("/delete-materials/:id", (req, res) => {
  const sql = "DELETE FROM materials WHERE ID=?";
  const id = req.params.id;
  db.query(sql, [id], (err, result) => {
    if (err) return res.json({ message: "Error inside server" });
    return res.json(result);
  });
});

// listen to localhost:5000
app.listen(5000, () => {
  console.log("server on");
});
