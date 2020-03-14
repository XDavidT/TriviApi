const express = require('express')
const getter_router = new express.Router()
const QuestionModel = require('../utilities/models/questionSchema')

//GET requests
    //Get question by ID
getter_router.get('/single-noquestion',(req,res)=>{
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
getter_router.get('/all-questions',(req,res)=>{
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
getter_router.get('/count-all',(req,res)=>{
    try{
        QuestionModel.estimatedDocumentCount({},(err,count)=>{
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
getter_router.get('/questions',(req,res)=>{
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
module.exports = getter_router