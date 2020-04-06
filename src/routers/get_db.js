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
    jwt.sign({},tokenConfig['key'],{expiresIn:tokenConfig['expire']},(err,token)=>{
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
    let limit = userPref['default-limit']

    // Default is in config file (current now is 50)
        // User can configure else, but for better performance must stay in range.
    if(req.query['limit'] !=={}){
        if(1 <= parseInt(req.query['limit']) && parseInt(req.query['limit']) <= 1000){
            limit = parseInt(req.query['limit'])
        }
    }

    //First - check for token,  if user have valid token
    checkForToken(req.query['token'],(err_token,tokenDocument)=>{
        if(err_token){
            result['error'] = true
            result['details'] = err_token
            res.status(206)
            res.jsonp(result)
        }
        else{
            //Second - we need to provide user data using the filters provided
            checkForQuestions(req,limit,tokenDocument,(err_question,questions)=>{
                if(err_question){
                    result['error'] = true
                    result['details'] = err_question
                    res.status(206)
                }
                else{
                    result['error'] = false
                    result['count'] = questions.length
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
    jwt.verify(token,tokenConfig['key'],(err,status)=>{
        if(err){
            delete err['expiredAt'] //User don't need to know when it expire
            callback(err,undefined)
        }
        else{
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

const checkForQuestions = (req,limit,tokenDocument,callback)=>{
    const mongoQuery = {}
    //Enable parameters, for mongo null in case provided nothing

    if(tokenDocument)   //Only id's NOT IN queue of the token
        mongoQuery['_id'] = {$nin:tokenDocument['queue']}

    if(req.query['type'] !== undefined)
        mongoQuery['type'] = req.query['type']

    if(req.query['lang'] !== undefined)
        mongoQuery['lang'] = req.query['lang']

    if(req.query['difficulty'] !== undefined)
        mongoQuery['difficulty'] = req.query['difficulty']
    
    if(req.query['category'] !== undefined)
        mongoQuery['category'] = req.query['category']
    
    try{ 
        QuestionModel.find(mongoQuery)
        .limit(limit)   //Assure the amount of questions/
        .exec((err,questions)=>{
            if(err){
                callback(err,undefined)
            }
            else{
                callback(undefined,questions)
                if(tokenDocument)
                    attachToToken(tokenDocument,questions)
            }
        })
    }catch(err){
        callback(err,undefined)
    }
}

function attachToToken(tokenDocument, newQuestions){
    if(!tokenDocument || !newQuestions){
        console.log("Oops.. something wrong");
        return
    }

    newQuestions.forEach(question => {
        TokenModel.updateOne({_id:tokenDocument['_id']},
        {$push:{queue:question['_id']}}).exec((err,_)=>{
            if(err)
                console.log(err)
        })
    })
}
module.exports = getter_router