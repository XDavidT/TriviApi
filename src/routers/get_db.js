const jwt = require('jsonwebtoken')
const express = require('express')
const getter_router = new express.Router()
const QuestionModel = require('../utilities/models/questionSchema')
const TokenModel = require('../utilities/models/tokenSchema')
const config = require('config')

// Get configration from config.json file
const tokenConfig = config.get('token')
const userPref = config.get('setting')

//GET requests

    //Get Session TOKEN
getter_router.get('/token',(req,res)=>{
    const result = {}
    jwt.sign({
        data:'Trivia'
    },tokenConfig['key'],{expiresIn:tokenConfig['expire']},(err,token)=>{
        if(err){
            result['error'] = true
            result['details'] = err
            res.jsonp(result)
        }
        else{
            // Add token to DB
            TokenModel.create({_id:token},(_err,_)=>{
                if(err){
                    result['error'] = true
                    result['details'] = _err
                }else{
                    result['error'] = false
                    result['expire'] = tokenConfig['expire']
                    result['token'] = token                
                }
                res.jsonp(result)
            })
        }
    })
})

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

    // Default is in config file (current now is 50)
        // User can configure else, but for better performance must stay in range.
    result['max'] = userPref['default-limit'] //TODO: limit onlt in good return
    if(req.query['limit'] !=={}){
        if(1 <= parseInt(req.query['limit']) && parseInt(req.query['limit']) <= 1000){
            result['max'] = parseInt(req.query['limit'])
        }
    }

    //First - check for token,  if user have valid token
    checkForToken(req.query['token'],(err_token,tokenDocuemt)=>{
        if(err_token){
            result['error'] = true
            result['details'] = err_token
            res.status(501)
            res.jsonp(result)
            return
        }
        else{
            //Second - we need to provide user data using the filters provided
            checkForQuestions(req,result['max'],tokenDocuemt,(err_question,questions)=>{
                if(err_question){
                    result['error'] = true
                    result['details'] = err_question
                    res.status(501)
                }
                else{
                    result['error'] = false
                    result['result'] = questions
                }
                res.jsonp(result)
            })
        }

    })
})

const checkForToken = (token,callback)=>{

    if(token == undefined){     //User didn't provide any token
        callback(undefined,null)
        return
    }

    jwt.verify(token,tokenConfig['key'],(ver_err,decoded)=>{
        if(ver_err){
            callback(ver_err,undefined)
            return
        }
        else{
            console.log(decoded);
            
            try{        
                TokenModel.findById(token,(err,foundToken)=>{
                    if(err){
                        console.log(err)
                        callback(err,undefined)
                    }
                    else{
                        callback(undefined,foundToken)            
                    }
                })
            }catch(err){
                callback(err,undefined)
            }
        }
    })


}

const checkForQuestions = (req,limit,tokenDocuemt,callback)=>{

    //Token Validation used to provide better $nin when no token provided
    //Since the object ['questionsIds'] cannot be access in null and return error
    //$nin - Comparison Query Operators - when object is null no exception
    let tokenValidation = null
    
    try{
        //TODO: Fix the bug in 'questionsIds'
        if(tokenDocuemt)
            tokenValidation = tokenValidation.questionsIds
 
        QuestionModel.find({
            _id:{$nin:tokenValidation},
            type:req.query['type'],
            lang:req.query['lang'],
            difficulty:req.query['difficulty'],
            category:req.query['category']
        })
        .limit(limit)   //Assure the amount of questions
        .exec((err,questions)=>{
            if(err){
                callback(err,undefined)
            }
            else{
                callback(undefined,questions)
                if(tokenDocuemt)
                    attachToToken(tokenDocuemt,questions)
            }
        })
    }catch(err){
        callback(err,undefined)
    }
}

function attachToToken(tokenDocuemt, newQuestions){
    console.log("attachToToken")
        
    if(!tokenDocuemt || !newQuestions){
        console.log("Oops.. something wrong");
        return
    }

    newQuestions.forEach(question => {
        TokenModel.updateOne({_id:tokenDocuemt['_id']},
        {$push:{questionsIds:question['_id']}}).exec((err,_)=>{
            if(err)
                console.log(err)
        })
    })

    console.log("finish")
}
module.exports = getter_router