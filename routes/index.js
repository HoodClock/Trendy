var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const roomModel = require("./rooms");
const passport = require("passport");
const localStrategy = require('passport-local');
const uploads = require('./multer');
const RoomPost = require("./roomPost");
const chatModel = require("./chat");


passport.use(new localStrategy(userModel.authenticate()));

// GET METHOD ROUTES✌
// Home Page
router.get("/", function (req, res, next) {
  res.render("index");
});

// chat page
router.get("/chat", isLoggedIn, function(req, res, next){
  res.render('chat');
})

// profile page
router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user =
    await userModel
      .findOne({ username: req.session.passport.user })
      .populate("post");
  res.render("profile", { user });
});

// chamber page
router.get("/chamber", isLoggedIn, async function (req, res) {
  try {

    // fetching all rooms, not just for the user who is Logged In
    const allRooms = await roomModel.find({});

    const user = await userModel.findOne({ username: req.session.passport.user }).populate("rooms");

    res.render("chamber", { user, allRooms });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// post page
router.get("/post", isLoggedIn, function (req, res, next) {
  res.render("post");
});

// post of room page
router.get("/roomPost", isLoggedIn, async function (req, res, next) {
  res.render("roomPost");
})

// feed page
router.get("/feed", isLoggedIn, async function (req, res, next) {
  const postId = req.body.postID;

  try {
    const allUserData = await userModel.find({}).populate("post");
    const post = await postModel.findById(postId);

    res.render("feed", { allUserData });
  } catch (err) {
    res.status(500).send("Something Went Wrong!")
  }
});

// room page
router.get("/room/:roomId", isLoggedIn, async function (req, res) {
  try {
    // populating the rooms form the user
    const allUserData = await userModel.find({}).populate("rooms");

    // fetching the single user
    const user = await userModel.findOne({ username: req.session.passport.user });

    // fetching hte roomId
    const roomId = req.params.roomId;

    // validating the member array in the room
    const room = await roomModel.findOne({ _id: roomId, members: user._id });

    // Fetching the room with populated posts and user details within each post
    const populatedData = await roomModel
      .findById(roomId)
      .populate({
        path: 'posts',
        populate: {
          path: 'user',
          model: 'User',
        },
      });


    // if not a room member, then display the error
    if (!room) {
      return res.status(404).send("You must join the room first😎");
    }

    if (!allUserData) {
      // Handle case where user is not found
      return res.status(404).send("User not found");
    }

    res.render("room", { room: populatedData, user, allUserData });
  } catch (err) {
    console.error(err);
    // Handle other errors
    res.status(500).send("Internal Server Error");
  }
});



// POST METHODS ROUTES🤞

// Likes post Route
router.post("/LikedPost", isLoggedIn, async function (req, res) {
  const postId = req.body.postID;

  try {
    // to get the id of the post that was cliked for liked
    const posts = await postModel.findById(postId);

    // increment on post 
    posts.Likes += 1;

    // now save the route
    await posts.save();

    // redirect the user to feed page 
    res.redirect("/feed");
  } catch (err) {
    res.send(err);
  }
});

// route to handel the upload
router.post("/fileUpload", isLoggedIn, uploads.single("image"), async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  user.ProfileImage = req.file.filename;
  await user.save();
  res.redirect('/profile');
});

// post creaetion and uploading
router.post("/postUpload", isLoggedIn, uploads.single("postImage"), async function (req, res, next) {
  if (!req.file) {
    return res.status(404).send("Something Went Wrong!!!😡");
  }

  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.create({
      PostText: req.body.fileCaption,
      image: req.file.filename,
      user: user._id
    });
    user.post.push(post._id);
    await user.save();

    res.redirect("/profile");
  } catch (err) {
    console.log(err)
    res.status(404).send("Something Went Wrong!!!😡");
  }
});

// post creation of the room page
router.post("/roomPostUpload", isLoggedIn, async function (req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    const roomId = req.body.roomId;

    const room = await roomModel.findById(roomId);

    const roomPost = await RoomPost.create({
      PostText: req.body.fileCaption,
      user: user._id,
      room: roomId,
    });

    room.posts.push(roomPost._id);
    // saving the room and post
    await room.save();
    await user.save();

    res.redirect(`/room/${roomId}`);
  } catch (err) {
    console.log(err);
    res.status(404).send("Something Went Wrong!!!😡 form roomPostUpload Route");
  }
});

// delete post
router.post("/deletePost", isLoggedIn, async function (req, res, next) {
  try {
    // let there be the post which i delete
    const postToDelete = req.body.postDetails;


    await userModel.findOneAndUpdate({ username: req.session.passport.user }, { $pull: { post: postToDelete } }, { new: true });

    res.redirect("/profile");
  } catch (err) {
    res.status(500).send("OOps Something went wrong!");
  }
});

// create room
router.post("/createRoom", isLoggedIn, async function (req, res, next) {
  try {
    // finding user 
    const user = await userModel.findOne({ username: req.session.passport.user });

    // if user not found
    if (!user) {
      return res.redirect("/login");
    }

    // creating the room
    const room = await roomModel.create({
      roomname: req.body.roomname,
      roompurpose: req.body.roompurpose,
      roomtags: req.body.roomtags,
      owner: user._id,
    });

    // pushing created room into room field in the user model
    user.rooms.push(room._id);

    // save the user with the updated rooms 
    await user.save();

    // redirecting to chamber page
    res.redirect("/chamber");

    console.log("Received form data:", req.body);
  } catch (err) {
    console.error(err);
    // Use a 500 status code for internal server errors
    res.status(500).send("Internal Server Error: Unable to create room.");
  }
});

// Join Room
router.post("/roomJoin", isLoggedIn, async function (req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const roomId = req.body.roomId;

    // getting the room id form the hidden input so we can paly with room
    const room = await roomModel.findById(roomId);

    // Check if the user is already a member of the room
    if (room.members.includes(user._id)) {
      return res.render("404error");
    }

    // Add the user to the room's members array
    room.members.push(user._id);

    // Save the changes to the room
    await room.save();

    res.redirect("/chamber");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});




// some nessessory Routes👌

// rendring the register page
router.get("/register", function (req, res, next) {
  res.render("register");
});

// register the user in a database
router.post("/register", function (req, res, next) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
  });

  userModel
    .register(userData, req.body.password)
    .then(function (registereduser) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      });
    });
});

// for protected route
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// for login
router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login'
}), function (req, res, next) {
});

// for logout
router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/profile");
  });
});

module.exports = router;
