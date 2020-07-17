const mongoose = require('mongoose')
const config = require('config')
const mongodbConnection = require('../models/connection')

// Get configration from config.json file
const dbConfig = config.get('dbConfig')
const adminToken = dbConfig['mongodb-adminToken-collection']

const tokenSchema = new mongoose.Schema({
    _id:{
        type:String,
        required:true
    },
    key:{
        type:String,
        required:true
    }
},{
    versionKey: false,
    collection:adminToken
})

const AdminToken = mongodbConnection.model('AdminToken',tokenSchema)
module.exports = exports = AdminToken