const mongoose = require('mongoose')
const config = require('config')
const mongodbConnection = require('../models/connection')

// Get configration from config.json file
const dbConfig = config.get('dbConfig')
const categoryCollection = dbConfig['mongodb-category-collection']

const catSchema = new mongoose.Schema({
    _id:Number,
    name:{
        type:String,
        required:true
    },
},{
    versionKey: false,
    collection:categoryCollection
})

const Categories = mongodbConnection.model('Categories',catSchema)
module.exports = exports = Categories