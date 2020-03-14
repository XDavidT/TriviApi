const mongoose = require('mongoose')
const config = require('config')

// Get configration from config.json file
const dbConfig = config.get('dbConfig')

const connectionUrl = dbConfig['mongodb-connectionURL']
const triviApiDb =  dbConfig['mongodb-trivia-db-name']

const connection = mongoose.createConnection(connectionUrl,{
    dbName: triviApiDb,
    useNewUrlParser: true,
    useUnifiedTopology: true
    },
    (err)=>{
        if(err)
        console.log("Mongoose fail on connection:\n"+err)
    }
)

module.exports = connection