const express = require('express')
const cors = require("cors")
const connDB = require('./db/connection.js');
const User = require("./db/User")
const Product = require("./db/Product")
const dotenv = require('dotenv')

const router = express.Router()

// const router = express.Router();

const Jwt = require('jsonwebtoken');

dotenv.config({path:"config.env"})


//connection DB 
connDB()

const corsOptions = {
   origin: '*',
   credentials: true,
   optionSuccessStatus: 200,
}


const app = express();
app.use(express.json());

app.use(cors(corsOptions))

app.use(router)

//=============== Register user ==================================

router.route('/register').post(async (req, resp) => {
   let user = new User(req.body);
   let result = await user.save();
   result = result.toObject();
   delete result.password
   Jwt.sign({ result }, process.env.JWT_KEY, { expiresIn: "2h" }, (err, token) => {

      if (err) {
         resp.send("Something went wrong,please try again")
      }
      resp.send({ result, auth: token })

   })
})


//=============== Login user ==================================
router.route("/login").post(async (req, resp) => {
   if (req.body.password && req.body.email) {
      let user = await User.findOne(req.body).select("-password");
      if (user) {
         Jwt.sign({ user },process.env.JWT_KEY, { expiresIn: "2h" }, (err, token) => {

            if (err) {
               resp.send("Something went wrong,please try again")
            }
            resp.send({ user, auth: token })

         })

      }
      else {
         resp.send({ result: "No user Found" })
      }
   } else {
      resp.send({ result: "fill email and password both" })
   }

})



//=============== Add Product ==================================
router.route('/add-product').post(async (req, resp) => {
   let product = new Product(req.body);
   let result = await product.save();
   resp.send(result)
})

//=============== Get Product ==================================
router.route("/product").get(async (req, resp) => {
   let products = await Product.find()
   if (products.length > 0) {
      resp.send(products)
   }
   else if(products.length=0){
      resp.send("No Data")
   }
   else {
      resp.send({ result: "No Products found" })
   }
})

//===================== Delete Product ===============================
router.route("/product/:id").delete(async (req, resp) => {
   let product = Product.findById(req.params.id)

   if(!product){
       return resp.status(500).json({
           succuss:false,
           message:"Product not found"
       })
   }

   await product.deleteOne()
})


//========================== Get Product for Update ==========================
router.route("/product/:id").get(async (req, resp) => {
   try {
      let result = await Product.findOne({ _id: req.params.id })
      if (result) {
         resp.send(result)
      } else {
         resp.send({ result: "No Record Found" })
      }
   }
   catch (err) {
      console.log("Error Somewhere")
   }
})

//======================= Update Product ===============================
router.route("/product/:id").put(async (req, resp) => {
   let result = await Product.updateOne(
      { _id: req.params.id },
      {
         $set: req.body
      }
   )
   resp.send(result)
})


// ===================== Search Product ==================================
router.route("/search/:key").get( async (req, resp) => {
   let result = await Product.find({
      "$or": [
         { name: { $regex: req.params.key, $options: 'i' } },
         { company: { $regex: req.params.key, $options: 'i' } },
         { category: { $regex: req.params.key, $options: 'i' } },
         { userId: { $regex: req.params.key, $options: 'i' } }
      ]
   })
   resp.send(result)
})


//==================== Middleware =================================================

// function verifyToken(req,resp,next){
//      let token = req.headers['authorization'];
//      if(token){
//        token = token.split(' ')[1];
//        console.log("Middleware Called if",token)
//        Jwt.verify(token,JwtKey,(err,valid)=>{
//            if(err){
//             resp.send({result:"Please provide valid token"})
//            }else{
//             next();
//            }
//        })
//      }else{
//         resp.send({result:"Please add token with header"})
//      }
//    //   console.log("Middleware Called",token)
// }

app.listen(process.env.PORT || 5000)

console.log(`Server is running at - ${process.env.PORT || 5000}`)