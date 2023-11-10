const mongoose = require("mongoose")

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connection id:${conn.connection.host}`);
  }catch(error){
    console.log(`error:${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDb;