require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('config')
const syncCat = require('./utilities/models/categoryManager')

const app = express()
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())

const modify_router = require('./routers/modify_db')
const getters_router = require('./routers/get_db')

app.use('/modify',modify_router)
app.use('/get',getters_router)

// Only need to run at the start of the application
// console.log(syncCat())

app.get('*',(req,res)=>{
    console.log("Someone try to GET.. look that:"+req.query);
    res.redirect(config.get('site'))
})
app.post('*',(req,res)=>{
    console.log("Someone try to POST.. look that:"+req.query);
    res.redirect(config.get('site'))
})

app.listen(80,()=>{
    console.log("Server is up in port 80")
})