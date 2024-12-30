const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const generateToken = require("../config/generateToken");




const registerUser = expressAsyncHandler(async (req, res) => {
  const { name, email, password, pic, ad } = req.body;
  let isAdmin = false;
  if(email === process.env.ADMIN_USER){
    isAdmin = true;
  }

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill all the fields")
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
    isAdmin,
    ad
  });

  const adminUser = await User.findOne({ email: process.env.ADMIN_USER, isAdmin: true });

  const added = await Chat.findOneAndUpdate(
    {groupAdmin: (adminUser._id), isGroupChat: true},
    {
      $push: { users: user._id },
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");


  if (!added) {
    var users = [];
    users.push(user);
    try {
      const groupChat = await Chat.create({
        chatName: 'Community',
        users: users,
        isGroupChat: true,
        groupAdmin: adminUser,
      });

      const FullGroupChat = await Chat.findOne({_id:groupChat._id})
        .populate("users","-password")
        .populate("groupAdmin","-password");

        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          pic: user.pic,
          isAdmin: isAdmin,
          ad: user.advertisement,
          token: generateToken(user._id),
        });

    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  } else {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      isAdmin: isAdmin,
      ad: user.advertisement,
      token: generateToken(user._id),
    });
  }

  if(!user) {
    res.status(401);
    throw new Error("Unable to create user")
  }
});



const authUser = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    })
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});


const allUsers = expressAsyncHandler(async (req, res) => {
  const keyword = req.query.search ?
    {
      $or: [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } }
      ],
    } : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
})


module.exports = { registerUser, authUser, allUsers };