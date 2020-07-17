const express = require('express')
const modify_router = new express.Router()
var SHA1 = require('crypto-js/sha1')
const bcrypt = require('bcrypt')

const QuestionModel = require('../utilities/schema/questionSchema')
const AdminModel = require('../utilities/schema/adminSchema')

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

    //Verfiy question by 2 options - accept or reject
    //Need to provide:
        //Question ID
        //Admin KEY
        //Verified ( True - change pending to flase, False - remove the question)
modify_router.post('/verify-question', (req,res)=>{
    const result = {}

    if(!req.query.question_id || !req.query.key || !req.query.verified){
        res.jsonp("Missing Parameters")
    }
    else{
        try{
            AdminModel.find({key:req.query.key},(err,_)=>{
                if(err){
                    result['error'] = true
                    result['details'] = err
                    res.jsonp(result)
                }
                else{
                    if(req.query.verified == 'true'){
                        QuestionModel.updateOne({_id:req.query.question_id},{$unset:{pending:"true"}},(_err,_)=>{
                            if(_err){
                                result['error'] = true
                                result['details'] = err
                            }
                            else{
                                result['error'] = false
                                result['status'] = "ADDED"
                            }
                            res.jsonp(result)
                        })
                    }
                    else{
                        QuestionModel.remove({_id:req.query.question_id},(err,_)=>{
                            if(err){
                                result['error'] = true
                                result['details'] = err
                            }
                            else{
                                result['error'] = false
                                result['status'] = "REMOVED"
                            }
                            res.jsonp(result)
                        })
                    }
                }
            })
        }catch(err){
            result['error'] = true
            result['details'] = err
            res.jsonp(result)
        }
    }
})

module.exports = modify_router