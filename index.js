const express = require("express");
const cors = require("cors");
// Environment variables
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

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

    //   ************ assignment related APIs **************

    // 2. get all assignments from the database
    app.get("/assignments", async (req, res) => {
      const cursor = assignmentsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // 1. get the assignment from the client side
    app.post("/assignments", async (req, res) => {
      const newAssignment = req.body;
      const result = await assignmentsCollection.insertOne(newAssignment);
      res.send(result);
    });

    // 3. delete an assignment
    app.delete("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const cursor = await assignmentsCollection.deleteOne(query);
      res.send(cursor);
    });

    // ********* submission related APIs **************

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
