const express = require('express')
const app = express()

const modify_router = require('./routers/modify_db')

const errorMsg ={"Error":"Invalid Api request"}
app.use('/modify',modify_router)


app.get('*',(req,res)=>{
    console.log("General Error!");
    res.status(501).send("error")
})
app.post('*',(req,res)=>{
    console.log("General Error!");
    res.status(501).send("error")
})



app.listen(3000,()=>{
    console.log("Server is up in port 3000")
})