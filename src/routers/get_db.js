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
getter_router.get('/single-question',(req,res)=>{
    const result = {}
    result['error'] = true
    console.log(req.query);
    
    if(!req.query['id']){
        result['details'] = 'No ID provided'
        res.jsonp(result)
        return
    }
    
    try{
        QuestionModel.findById(req.query['id'],(err,question)=>{
            if(err){
                result['details'] = err
                res.jsonp(result)
            }
            else{
                result['error'] = false
                result['result'] = question
                res.jsonp(result)
            }
        })
    } catch(err){
        console.log("Error to get question: \n"+err)
        res.status(501)
    }
})

    //Get the number of questions in DB //Not public
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

    //Get all question without query //Not public
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


getter_router.get('/questions-to-datatable',(req,res)=>{
    const result ={}

    //Limit
    const limit = Number(req.query['length'])

    //Skip
    const skip = Number(req.query['start'])

    //Order By
    const orderBy = {}
    var orderType = 1
    if(req.query['order'][0]['dir'] == 'desc') {orderType = -1}
        orderBy[req.query['columns'][req.query['order'][0]['column']]['data']] = orderType
    
    //Filter By
    const filterBy = FilterQuery(req.query['columns'])
    
    try{
        QuestionModel.
            aggregate([{
                $facet:
                    {
                        //Data to table
                        "data":[
                            {$match:filterBy},
                            {$skip:skip},
                            {$limit:limit},
                            {$sort:orderBy}
                            ],
                        //Count the number of result after filtered
                        "filterCount":[{$match:filterBy}, {$group:{_id:null,count:{$sum:1}}}],
                        //Count total in collection
                        "totalCount":[{$group:{_id:null,count:{$sum:1}}}]                        
                    }
        }]).exec((err,found)=>{
            if(err){
                result['details'] = err
            }else{
                result['data'] = found[0]['data']
                if(found[0]['filterCount'][0])
                    result['recordsFiltered'] = found[0]['filterCount'][0]['count']
                if(found[0]['totalCount'][0])
                    result['recordsTotal'] = found[0]['totalCount'][0]['count']
            }
            res.jsonp(result)
            
        })
    } catch(err){
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

//Token functions
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

const FilterQuery = (cols) => {
    const filterQuery ={}
    
    for(var i = 0 ; i< cols.length ; i++){
        if(cols[i]['search']['value'] != '')
            filterQuery[cols[i]['data']] = cols[i]['search']['value']
    }
    
    //If difficult is needed, convert to INT
    if(filterQuery['difficulty'] && filterQuery['difficulty'] != '')
        filterQuery['difficulty'] = Number(filterQuery['difficulty'])

    //If Question search was made, use regex search
    if(filterQuery['question'] && filterQuery['question'] != '')
        filterQuery['question'] = {$regex:filterQuery['question']}
    
    return filterQuery
}

module.exports = getter_router