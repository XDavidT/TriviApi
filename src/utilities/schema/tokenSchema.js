const mongoose = require('mongoose')
const config = require('config')
const mongodbConnection = require('../models/connection')

// Get configration from config.json file
const dbConfig = config.get('dbConfig')
const tokenStore = dbConfig['mongodb-token-collection']

const tokenSchema = new mongoose.Schema({
    _id:{
        type:String,
        required:true
    },
    queue:Array
},{
    versionKey: false,
    collection:tokenStore
})

const TokenStore = mongodbConnection.model('TokenStore',tokenSchema)
module.exports = exports = TokenStore