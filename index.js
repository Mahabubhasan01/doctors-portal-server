const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');




app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qojw0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
 async function run(){
    try{
        await client.connect();
        const serviceCollections=  client.db('doctors_portal').collection('services');

        app.get('/service',async(req,res)=>{
            const query = {}
            const cursor = serviceCollections.find(query)
            const collection = await cursor.toArray();
            res.send(collection)
        })
    }
    finally{

    }
 }
 run().catch(console.dir)




app.listen(port,()=>console.log('My site is running',port))