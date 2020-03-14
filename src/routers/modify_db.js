const express = require('express')
const modify_router = new express.Router()
const QuestionModel = require('../utilities/models/questionSchema')

// POST Requests
    //Add ONE question
modify_router.post('/add-question',(req,res)=>{
    try {
        QuestionModel.create(req.query,(err,document)=>{
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

//GET requests
    //Get question by ID
modify_router.get('/get-question',(req,res)=>{
    const result = {}

    if(req.query['id'] !== {}){
        result['error'] = true
        result['details'] = 'No ID provided'
        res.status(501).jsonp()
    }
    
    try{
        QuestionModel.findById(req.query['id'],(err,question)=>{
            if(err){
                result['error'] = true
                result['details'] = err
                res.jsonp().status(501)
            }
            else{
                result['error'] = false
                result['result'] = question
                res.jsonp(result)
            }
        })
    } catch(err){
        console.log("Error to get question: \n"+err)   
    }
})

    //Get all question without query
modify_router.get('/get-all-questions',(req,res)=>{
    const result = {}
    try{
        QuestionModel.find({ },(err,questions)=>{
            if(err){
                result['error'] = true
                result['details'] = err
                res.status(501)
            }
            else{
                result['error'] = false
                result['result'] = questions
            }
            res.jsonp(result)
        })
    } catch(err){
        console.log(err);
    } 
})

    //Get the number of questions in DB
modify_router.get('/count-questions',(req,res)=>{
    try{
        QuestionModel.count({},(err,count)=>{
            const result={}
            if(err){
                result['error'] =true
                result['details'] = err
                res.status(501)
            }
            else{
                result['error'] = false
                result['result'] = count
            }
            res.jsonp(result)
        })
    }catch(err){
        console.log(err);
    }
})

    //Get the question filtered by parameters
modify_router.get('/get-questions-filterd',(req,res)=>{
    const result ={}
    let limit = 50 //Set default if user didn't provide
    
    //Testing we got all filters 
    try{
        //Checking if there is limit in range, if not taking default
        if(req.query['limit'] !=={}){
            limit = parseInt(req.query['limit'])
            if(limit >1000 || limit <1){
                result['error'] = true
                result['details'] = 'Must provide limit in range(1<limit<1000)'
                res.status(501).jsonp(result)
                return
            }
        }

        QuestionModel.find({
            type:req.query['type'],
            lang:req.query['lang'],
            difficulty:req.query['difficulty'],
            category:req.query['category']
        }).limit(limit).exec((err,questions)=>{
            if(err){
                result['error'] = true
                result['details'] = err
                res.status(501)
            }
            else{
                result['error'] = false
                result['result'] = questions
            }
            res.jsonp(result)
        })
    }catch(err){
        console.log(err)
    }
})

module.exports = modify_router