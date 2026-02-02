import { match } from "assert";
import { json } from "stream/consumers";

class ApiFeatures {

    constructor(query,queryString,PopulatedObj = {}){
        this.query = query;
        this.queryString = queryString;
        this.PopulatedObj = PopulatedObj
    }
    filter() {
        const queryObj = {...this.queryString}
        

        let excludedFields = ['page', 'sort', 'fields', 'limit']
        
        excludedFields.forEach(element => {
            delete queryObj[element]
        })

        
        Object.keys(queryObj).forEach(key => {
            if(key.includes(".")) {
                this.PopulatedObj[key] = queryObj[key]
                delete queryObj[key]
            }
        })
        

        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|nin)\b/g, match => `$${match}`)
        
       
        
       
        this.query = this.query.find(JSON.parse(queryStr))

        return this
    }
    
    populatedFilter(docs) {
        
        if (Object.keys(this.PopulatedObj).length === 0) {
            return docs
        }
        const filteredDocs = docs.filter(doc => {
            return Object.entries(this.PopulatedObj).every(([key, value]) => {
                                
                const keys = key.split('.')  
                let current = doc  
                
                
                for (const k of keys) {
                  
                    
                    if (current && typeof current === 'object') {
                        current = current[k]
                        
                    } else {
                     
                        return false  
                    }
                }
                
                
             
                return current === value
            })
        })
        
        console.log(`Filtered ${docs.length} docs down to ${filteredDocs.length} docs`)
        return filteredDocs
    }

    sort(){
        if(this.queryString.sort){
            const sortby = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortby)
        }
        else
        {
           this.query =  this.query.sort('-createdAt')
        }
        return this
    }
    limitFields(){

        if(this.queryString.fields){
           const  fields = this.queryString.fields.split(',').join(' ')
           this.query = this.query.select(fields)
        }
        else{
            this.query = this.query.select('-__v')
        }
        return this
    }

    pagination(){
        const page = this.queryString.page *1 || 1 ;
        const limit  = this.queryString.limit *1 || 50
        const skip = (page-1)*limit

        this.query = this.query.skip(skip).limit(limit)

        return this
    }
}

export default ApiFeatures


// constructor(query, queryString) {
//         this.query = query
//         this.queryString = queryString
//         this.PopulatedObj = {}  
//     }
    
//     filter() {
//         const queryObj = {...this.queryString}
//         console.log("Original queryObj:", queryObj)

//         let excludedFields = ['page', 'sort', 'fields', 'limit']
        
//         excludedFields.forEach(element => {
//             delete queryObj[element]
//         })

        
//         Object.keys(queryObj).forEach(key => {
//             if(key.includes(".")) {
//                 this.PopulatedObj[key] = queryObj[key]
//                 delete queryObj[key]
//             }
//         })
        

//         let queryStr = JSON.stringify(queryObj)
//         queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|nin)\b/g, match => `$${match}`)
        
//         console.log("Final query string for MongoDB:", queryStr)
        
       
//         if (queryStr !== '{}') {
//             this.query = this.query.find(JSON.parse(queryStr))
//         }

//         return this
//     }
    
//     populatedFilter(docs) {

//         if (Object.keys(this.PopulatedObj).length === 0) {
//             console.log("No populated filters, returning all docs")
//             return docs
//         }
//         const filteredDocs = docs.filter(doc => {
         
//             return Object.entries(this.PopulatedObj).every(([key, value]) => {
//                 console.log(`Checking filter: ${key} = ${value} for user ${doc._id}`)
                
//                 const keys = key.split('.')  
//                 let current = doc  
                
                
//                 for (const k of keys) {
//                     console.log(`  Looking for property: ${k} in`, current)
                    
//                     if (current && typeof current === 'object') {
//                         current = current[k]
//                         console.log(`  Found:`, current)
//                     } else {
//                         console.log(`  Path broken at ${k}, returning false`)
//                         return false  
//                     }
//                 }
                
                
//                 console.log(`  Final value: ${current}, Expected: ${value}`)
//                 return current === value
//             })
//         })
        
//         console.log(`Filtered ${docs.length} docs down to ${filteredDocs.length} docs`)
//         return filteredDocs
//     }