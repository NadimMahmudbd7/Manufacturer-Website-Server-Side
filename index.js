const express = require('express');
const cors = require('cors');
require('dotenv').config()
var jwt = require('jsonwebtoken');
const res = require('express/lib/response');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3hidy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const TotalServiceCollections = client.db("ProductsCollection").collection("Products");
const TotalReviewsCollections = client.db("ProductsCollection").collection("Reviews");
const TotalOrder = client.db("ProductsCollection").collection("Orders");
const TotalUsers = client.db("ProductsCollection").collection("Users");

console.log("db connected");



// jwt authentication

function VerifyJwt(req, res, next) {
    const getToken = req.headers.authorization

    if (!getToken) {
        return res.status(401).send({ Message: "unauthorized access" })
    }
    else {
        const token = getToken.split(" ")[1]
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                console.log(err)
            }

            req.decoded = decoded
            next()

        });
    }
}

async function run() {
    try {
        await client.connect()



        // All products show for dashboard

        app.get("/products", async (req, res) => {
            const products = await TotalServiceCollections.find({}).toArray()
            res.send({ success: "successfully uploaded products", products })
        })




        // All Reviews show for dashboard

        app.get("/reviews", async (req, res) => {
            const reviews = await TotalReviewsCollections.find({}).toArray()
            res.send({ success: "successfully uploaded reviews", reviews })
        })



        // find and payment for per user

        app.get("/payment/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await TotalServiceCollections.findOne(query)
            res.send({ success: "get successfully", result })
        })




        // total user find for just admin

        app.get("/users", VerifyJwt, async (req, res) => {
            const email = req?.query?.email
            const user = req.query.user
            const decodedEmail = req.decoded;

            if (email === decodedEmail) {
                const result = await TotalUsers.find().toArray()
                return res.send({ success: "success", result })
            }
            else {
                return res.send({ success: "error" })
            }
        })




        // create user and set database 

        app.put("/users/:email", async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const user = req.body
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await TotalUsers.updateOne(filter, updateDoc, options);
            res.send({ result })
        })




        // get per user

        app.get("/user", async (req, res) => {
            const email = req.query.email
            const filter = { email: email }
            const user = await TotalUsers.findOne(filter)
            res.send(user)
        })




        // Collect per user all orders

        app.get('/myorders', VerifyJwt, async (req, res) => {
            const email = req?.query?.email

            const decodedEmail = req.decoded;


            if (email === decodedEmail) {
                const filter = { email: email }
                const result = await TotalOrder.find(filter).toArray()
                return res.send({ success: "success", result })
            }
            else {
                return res.send({ success: "error" })
            }

        })



        // add new product just for admin

        app.post("/addproducts", async (req, res) => {
            const filter = req.body
            const products = await TotalServiceCollections.insertOne(filter)
            res.send({ success: "products uploaded", products })
        })




        // add review for all user

        app.post("/reviews", async (req, res) => {
            const filter = req.body
            const reviews = await TotalReviewsCollections.insertOne(filter)
            res.send({ success: "review uploaded", reviews })
        })



        // per user order placed

        app.post("/orders", async (req, res) => {
            const filter = req.body
            const order = await TotalOrder.insertOne(filter)
            res.send({ success: "review uploaded", order })
        })




        // per user when paid the bill then update database

        app.put("/orders", async (req, res) => {
            const id = req.query.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    payment: "paid"
                }
            };
            const payment = await TotalOrder.updateOne(filter, updateDoc, options);
            res.send({ success: "payment done", payment })
        })




        // when admin shipped product then update database

        app.put("/order", async (req, res) => {
            const id = req.query.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    shipping: "confirm"
                }
            };
            const payment = await TotalOrder.updateOne(filter, updateDoc, options);
            res.send({ success: "payment done", payment })
        })




        // update all users profile

        app.put("/user/:email", async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const user = req.body
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await TotalUsers.updateOne(filter, updateDoc, options);
            const token = jwt.sign(email, process.env.ACCESS_TOKEN);
            res.send({ result, token })
        })



        //  add make to admin 

        app.put("/user/admin/:email", VerifyJwt, async (req, res) => {
            const email = req.params.email
            const requester = req.decoded
            const requesterAccount = await TotalUsers.findOne({ email: requester })
            if (requesterAccount.Role === "admin") {

                const filter = { email: email }
                const updateDoc = {
                    $set: { Role: "admin" }
                };
                const result = await TotalUsers.updateOne(filter, updateDoc);
                res.send(result)
            }
            else {
                res.status(403).send({ Message: "Forbidden" })
            }
        })




        // remove make to admin 

        app.patch("/user/admin/:email", async (req, res) => {
            const email = req.params.email
            const filter = { email: email }

            const updateDoc = {
                $set: { Role: "" }
            };
            const result = await TotalUsers.updateOne(filter, updateDoc);
            res.send(result)
        })



        // Default for checking
        
        app.put("/products", async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }

        })




        // total orders collected to admin dashboard

        app.get("/totalorder", VerifyJwt, async (req, res) => {
            const orders = await TotalOrder.find().toArray()
            res.send({ success: "order collected", orders })
        })




        // product stock status and other inmormation

        app.put("/deliverproduct/:id", async (req, res) => {
            const id = req.params.id
            let previusQty = parseInt(req.body.qty)
            if (previusQty < 1) {
                res.send({ error: "Sold Out" })
            }
            else {
                const deliverQty = parseInt(req.body.deliverQty)
                if (previusQty < deliverQty || deliverQty <= 0) {
                    res.send({ error: "Oops !! Pleasee Check Stock" })
                }

                else {
                    previusQty = previusQty - deliverQty
                    const filter = { _id: ObjectId(id) }
                    const options = { upsert: true };
                    const updateDoc = {
                        $set: {
                            available: previusQty
                        }
                    };
                    const result = await TotalServiceCollections.updateOne(filter, updateDoc, options)
                    res.send({ successfull: "successfull", result: result })
                }
            }
        })




        // per user when pay button click to collect this product

        app.get("/dashboard/payment/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await TotalOrder.findOne(query)
            console.log(result);
            res.send({ success: "get successfully", result: result })
        })




        // delete per order just for admin

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await TotalOrder.deleteOne(query)
            res.send(result)
        })




        
        // delete products in all products just for admin

        app.delete('/allproducts/:id', VerifyJwt, async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await TotalServiceCollections.deleteOne(query)
            res.send(result)
        })
    }
    finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send("website is running")
})

    // For port running
app.listen(port, () => {
    console.log("listening port:", port);
})