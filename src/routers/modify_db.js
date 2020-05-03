const express = require('express')
const modify_router = new express.Router()
var SHA1 = require('crypto-js/sha1')
const QuestionModel = require('../utilities/models/questionSchema')

// POST Requests
    //Add ONE question
modify_router.post('/add-question',async (req,res)=>{
    const result = {}
    const questionHash = SHA1(req.body['question'])
    
    try {
        //For automation or bulk add, need to assure the same question isn't exists
        const checkIfExists = await QuestionModel.findOne({'checkSum':questionHash.toString()})
        if(checkIfExists){
            throw ('Trying to add new question, but its already exists !')
        }
        
        //Adding the hash + place the question in hold
        req.body['pending'] = true
        req.body['checkSum'] = questionHash

        //When done to make all checking, query the DB
        QuestionModel.create(req.body,(err,document)=>{
            if(err){
                throw(err)
            }
            else{
                result['error'] = false
                result['result'] = document
                console.log("Question added")
            }
            res.jsonp(result)
        })
    }catch(err){
        result['error'] = true
        result['details'] = err
        res.jsonp(result)
    }
})

module.exports = modify_router