import mongoose from "mongoose";

export function toConnectDB() {
   mongoose.connect(process.env.MONGO_DB_URI)
   .then(()=>{
    console.log("Connect to Database")
   })
   .catch((err)=>{
    console.log("An error ouccred to connect Database", err);
    
   })
}