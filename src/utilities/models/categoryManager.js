const config = require('config')
const CategoryModel = require('../schema/catSchema')


module.exports = async () =>{
    const currentCategories = config.get('categories')    
    currentCategories.forEach(category => {
        CategoryModel.findOneAndUpdate(category,{},{upsert:true},(err,result)=>{
            if(err)
                console.log("ERROR !");
            else{
                // console.log("Category added !");
            }
        })
    })
    return "Category Sync Complete"
}