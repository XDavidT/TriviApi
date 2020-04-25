const https = require('https')
const express = require('express')
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
var cors = require('cors')

const app = express()
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())

const modify_router = require('./routers/modify_db')
const getters_router = require('./routers/get_db')

app.use('/modify',modify_router)
app.use('/get',getters_router)


app.get('*',(req,res)=>{
    console.log("General Error!");
    res.status(501).send("error")
})
app.post('*',(req,res)=>{
    console.log("General Error!");
    res.status(501).send("error")
})

app.listen(80,()=>{
    console.log("Server is up in port 80")
})