const https = require('https')
const express = require('express')
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.urlencoded({extended: true}))

const modify_router = require('./routers/modify_db')
const getters_router = require('./routers/get_db')

const privateKey  = fs.readFileSync(__dirname+'/utilities/ssl/server.key', 'utf8');
const certificate = fs.readFileSync(__dirname+'/utilities/ssl/server.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate}

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

const httpsServer = https.createServer(credentials,app)
httpsServer.listen(3000,()=>{
    console.log("Server is up in port 3000");
    
})