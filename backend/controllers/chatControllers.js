const expressAsyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");



const accessChat = expressAsyncHandler(async(req,res)=>{
  const {userId} = req.body;

  if(!userId){
    console.log("UserId parameter not found")
    return res.sendStatus(400)
  }

  var isChat = await Chat.find({
    isGroupChat:false,
    $and:[
      {users:{$elemMatch:{$eq:req.user._id}}},
      {users:{$elemMatch:{$eq:userId}}}
    ]
  }).populate("users","-password")
    .populate("latestMessage");
  
  isChat = await User.populate(isChat,{
    path:"latestMessage.sender",
    select:"name pic email",
  });

    if(isChat.length > 0){
      res.send(isChat[0]);
    } else { 
      var chatData = {
        chatName:"sender",
        isGroupChat:"false",
        users:[userId,req.user._id], 
      };

      try {
        const createChat = await Chat.create(chatData);
        const FullChat = await Chat.findOne({_id:createChat._id}).populate("users","-password");
        res.status(200).send(FullChat);
      } catch (error) {
        res.status(400);
        throw new Error(error.message);
      }
    }
});

const accessAdmin = expressAsyncHandler(async(req,res)=>{
  const adminUser = await User.findOne({ email: process.env.ADMIN_USER, isAdmin: true });
  var isChat = await Chat.find({
    isGroupChat:false,
    $and:[
      {users:{$elemMatch:{$eq:req.user._id}}},
      {users:{$elemMatch:{$eq:adminUser._id}}}
    ]
  }).populate("users","-password")
    .populate("latestMessage");
  
  isChat = await User.populate(isChat,{
    path:"latestMessage.sender",
    select:"name pic email",
  });

    if(isChat.length > 0){
      res.send(isChat[0]);
    } else { 
      var chatData = {
        chatName:"sender",
        isGroupChat:"false",
        users:[adminUser._id,req.user._id], 
      };

      try {
        const createChat = await Chat.create(chatData);
        const FullChat = await Chat.findOne({_id:createChat._id}).populate("users","-password");
        res.status(200).send(FullChat);
      } catch (error) {
        res.status(400);
        throw new Error(error.message);
      }
    }
});

const fetchChats = expressAsyncHandler( async (req,res)=>{
  try {
    Chat.find({users:{$elemMatch:{$eq:req.user._id}}})
      .populate("users","-password")
      .populate("groupAdmin","-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async(results)=>{
        results = await User.populate(results,{
          path:"latestMessage.sender",
          select:"name pic email",
        })
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error("No messages found");
  }
});


const createGroupChat = expressAsyncHandler(async(req,res)=>{
  if(!req.body.name || !req.body.users){
    return res.status(400).send({ message: "Please Fill all the fields" }); 
  }

  var users = JSON.parse(req.body.users);

  // if(users.length < 2){
  //   res.status(400).send("Group must contain atleast 3 participants");
  // }
  users.push(req.user);
  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const FullGroupChat = await Chat.findOne({_id:groupChat._id})
      .populate("users","-password")
      .populate("groupAdmin","-password");

    res.status(200).json(FullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
})


const renameGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});


const removeFromGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});


const addToGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

module.exports = {accessChat,fetchChats,createGroupChat,renameGroup,removeFromGroup,addToGroup,accessAdmin};