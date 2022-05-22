const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qojw0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.TOKEN, function (err, decoded) {
    console.log(decoded);
    if (err) {
      res.status(403).send({ message: "Forbidden" });
    }
    res.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    await client.connect();
    const serviceCollections = client
      .db("doctors_portal")
      .collection("services");
    const bookingCollections = client
      .db("doctors_portal")
      .collection("booking");
    const usersCollections = client.db("doctors_portal").collection("users");

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollections.find(query);
      const collection = await cursor.toArray();
      res.send(collection);
    });

    app.post("/booking", async (req, res) => {
      const bookingData = req.body;
      const query = {
        treatment: bookingData.treatment,
        date: bookingData.date,
        patient: bookingData.patient,
      };
      const exist = await bookingCollections.findOne(query);
      if (exist) {
        return res.send({ bookingData: false, bookingData: exist });
      }
      const result = await bookingCollections.insertOne(bookingData);
      res.send(result);
    });
    app.get("/available", async (req, res) => {
      const date = req.query.date || "11 APR 2022";
      // get all service

      const services = await serviceCollections.find().toArray();

      // single booking data

      const query = { date: date };
      const bookings = await bookingCollections.find(query).toArray();
      // find for each service
      services.forEach((service) => {
        const serviceBookings = bookings.filter(
          (b) => b.treatment === service.name
        );
        const booked = serviceBookings.map((s) => s.slot);
        const available = service.slots.filter((s) => !booked.includes(s));
        service.slots = available;
      });

      res.send(services);
    });

    app.get('/admin/:email',async(req,res)=>{
            const email = req.params.email;
            const user= await usersCollections.findOne({email:email});
            const isAdmin = user.role=== 'admin';
            res.send({admin:isAdmin});
    })
  
    app.get("/patient", verifyJWT, async (req, res) => {
      const patient = req.query.body;
      const decoded = req.decoded.email;
      if (patient === decoded) {
        const query = { patient: patient }
        const result = await bookingCollections.find(query).toArray();
        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    });
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await usersCollections.find().toArray();
      res.send(users);
    });
    app.put("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await usersCollections.findOne({email: requester});
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await usersCollections.updateOne(filter, updateDoc);
        res.send(result);
      };
      res.status(403).send({ message: "fuck life" });
    });
// ============================================================
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollections.updateOne(
        filter,
        options,
        updateDoc
      );
      const token = jwt.sign(
        { email: email },
        process.env.TOKEN
        /*  , {expiresIn: "1h",} */
      );
      res.send({ result, accessToken: token });
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => console.log("My site is running", port));
