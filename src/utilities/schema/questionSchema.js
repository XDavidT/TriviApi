const mongoose = require('mongoose')
const config = require('config')
const mongodbConnection = require('../models/connection')

// Get configration from config.json file
const dbConfig = config.get('dbConfig')
const questionsCollection = dbConfig['mongodb-questions-collection']

const questionSchema = new mongoose.Schema({
    question_id:mongoose.Types.ObjectId,
    time_added:{
        type:Date,
        default:Date.now
    },
    type:{
        type:String,
        required:true,
        trim:true,
        lowercase: true,
        enum:['multi','bool']
    },
    lang:{
        type:String,
        required:true,
        trim:true,
        lowercase: true
    },
    difficulty:{
        type:Number,
        required:true,
        trim:true,
        min:1,
        max:3
    },
    category:{
        type:Number,
        required:true
    },
    question:{
        type:String,
        required:true,
        trim:true
    },
    correctAnswer:{
        type:String,
        required:true,
        trim:true
    },
    wrongAnswer:{
        type:[String],
        default:undefined
    },
    pending:Boolean,
    checkSum:{
        type:String,
        required:false
    }
},{
    collection:questionsCollection
})

const Question = mongodbConnection.model('Question',questionSchema)
module.exports = exports = Question