const express = require('express');
const cors = require('cors');
const http = require('http');
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
const serviceAccount = require("./Config/sarowar-fashion-firebase-adminsdk-72rr1-3758d19756.json");

require('dotenv').config();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})


//local server port
const port = process.env.PORT || 4200;

//miidleware use
const app = express();
app.use(fileUpload())
app.use(express.static("uploads"))
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// mongodb collection

const { MongoClient } = require('mongodb');
const { error } = require('console');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nudkk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const productsCollection = client.db("FashionWorld").collection("allProducts");
    const orderCollection = client.db("FashionWorld").collection("order");
    const adminCollection = client.db("FashionWorld").collection("admin");


    //   //insert all products
    app.post("/addProduct", (req, res) => {
        const products = req.body;
        productsCollection.insertMany(products)
            .then(result => {
                if (result.insertedCount > 0) {
                    res.send(true);
                }
            })
    })


    // get daynamic products
    app.get("/collection/:category", (req, res) => {
        const name = req.params.category;
        productsCollection.find({ category: name })
            .toArray((err, products) => {
                res.send(products)
            })
    })


    // get feature products
    app.get("/allProducts", (req, res) => {
        productsCollection.find({})
            .toArray((err, products) => {
                res.send(products)
            })
    })

    // get single product
    app.get("/product/:productId", (req, res) => {
        const productId = req.params.productId;
        productsCollection.find({ _id: ObjectId(productId) })
            .toArray((err, product) => {
                res.send(product[0])
            })
    })


    // TAKE ORDER
    app.post("/order", (req, res) => {
        const orderInfo = req.body;
        orderCollection.insertOne(orderInfo)
            .then(result => {
                if (result.acknowledged) {
                    res.send(true);
                }
            })
    })

    // ORDER GET REQUEST
    app.get("/my-orders", (req, res) => {
        orderCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    // Delete order
    app.delete("/delete-order/:id", (req, res) => {
        const id = req.params.id;
        orderCollection.deleteOne({ _id: ObjectId(id) })
            .then(result => {
                if (result.deletedCount > 0) {
                    res.send(true);
                }
            })
    })

    //add product
    app.post("/add-product", (req, res) => {
        const data = req.body;
        const file = req.files.file;

        const newImg = file.data;
        const encImg = newImg.toString('base64')
        const image = Buffer.from(encImg, 'base64');

        const name = data.name;
        const price = data.price;
        const category = data.category;
        const details = data.details;
        console.log(image);
        productsCollection.insertOne({ name, price, category, details, binaryImg: image })
            .then(result => {
                if (result.acknowledged) {
                    res.send(true)
                }
            })

    })

    //is admin
    app.post("/isAdmin", (req, res) => {
        const token = req.headers.authorization;

        admin.auth()
            .verifyIdToken(token)
            .then(decodedToken => {
                const tokenEmail = decodedToken.email;
                adminCollection.find({email:tokenEmail})
                .toArray((err, admin) => {
                    if(admin.length > 0){
                        res.send(true)
                    }else{ 
                        res.send(false)
                    }
                })

            }).catch(error => {
                console.log(error);
            })
    })



});



// get request
app.get('/', (req, res) => {
    res.send("Hello World")
})

// listening server
app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});