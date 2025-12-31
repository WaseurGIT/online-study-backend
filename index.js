const express = require("express");
const cors = require("cors");
// Environment variables
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");

// Express & middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.febqytm.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // collections
    const assignmentsCollection = client
      .db("onlineStudyDB")
      .collection("assignments");
    const submissionsCollection = client
      .db("onlineStudyDB")
      .collection("submissions");
    const usersCollection = client.db("onlineStudyDB").collection("users");

    //   ************ JWT related API **************
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized" });
        }
        req.user = decoded;
        next();
      });
    };

    //   ************ assignment related APIs **************

    // 2. get all assignments from the database
    app.get("/assignments", async (req, res) => {
      const cursor = assignmentsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // 1. get the assignment from the client side
    app.post("/assignments", verifyToken, async (req, res) => {
      const newAssignment = req.body;
      const result = await assignmentsCollection.insertOne(newAssignment);
      res.send(result);
    });

    // 3. delete an assignment
    app.delete("/assignments/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const email = req.user.email;

      const result = await assignmentsCollection.deleteOne({
        _id: new ObjectId(id),
        creatorEmail: email,
      });

      if (result.deletedCount === 0) {
        return res
          .status(403)
          .send({ message: "Forbidden or assignment not found" });
      }
      res.send(result);
    });

    // 4. get a single assignment by id
    app.get("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const result = await assignmentsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // 5. update an assignment
    app.patch("/assignments/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedAssignment = req.body;

      const result = await assignmentsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedAssignment }
      );
      res.send(result);
    });

    // ********* submission related APIs **************

    // ********* users related APIs **************

    // 2. post a user to the database
    app.post("/users", async (req, res) => {
      const { email, uid } = req.body;
      if (!email || !uid) {
        return res.status(400).send({ message: "Invalid user data" });
      }
      const existingUser = await usersCollection.findOne({
        $or: [{ email }, { uid }],
      });
      if (existingUser) {
        return res.send({ message: "User already exists" });
      }
      const user = {
        ...req.body,
        role: "user",
        createdAt: new Date(),
      };
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    //1. get all users
    app.get("/users", verifyToken, async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // 3. get single user
    app.get("/users/:email", verifyToken, async (req, res) => {
      if (req.user.email !== req.params.email) {
        return res.status(403).send({ message: "Forbidden" });
      }

      const user = await usersCollection.findOne({ email: req.params.email });
      res.send(user);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Online Study Group Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
