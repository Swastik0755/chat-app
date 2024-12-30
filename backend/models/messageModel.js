const mongoose = require("mongoose")


const messageModel = mongoose.Schema({
  sender:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  content:{type:String,trim:true},
  type:{type:String},
  chat : {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Chat"
  }
},
{
  timestams:true,
});


const Message = mongoose.model("Message",messageModel);

module.exports = Message;