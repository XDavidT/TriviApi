const mongoose = require('mongoose')
const config = require('config')

// Get collection name
const dbConfig = config.get('dbConfig')

//Build connection for MongoDB  //next line is relevant for atlas server
const connectionUrl = 'mongodb+srv://' + process.env.DB_USER +':'+ process.env.DB_PASS +'@'+ process.env.DB_HOST
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