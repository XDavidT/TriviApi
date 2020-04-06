const express = require('express')
const modify_router = new express.Router()
const QuestionModel = require('../utilities/models/questionSchema')

// POST Requests
    //Add ONE question
modify_router.post('/add-question',(req,res)=>{
    console.log(req.body);
    try {
        QuestionModel.create(req.body,(err,document)=>{
            const result = {}
            if(err){
                result['error'] = true
                result['details'] = err
                res.status(501)
            }
            else{
                result['error'] = false
                result['result'] = document
                console.log("Question added")
            }
            res.jsonp(result)
            
        })
    }catch(err){
        console.log("Error to add question: \n"+err)
        
    }
})

module.exports = modify_router