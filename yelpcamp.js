var express = require("express")
var app = express()
var bodyParser = require("body-parser")
var flash = require("connect-flash")
app.use(bodyParser.urlencoded({ extended: true
}))
var campgrounds = require("./models/campgrounds")
var User = require("./models/users")
var comments = require("./models/comments")
var passport = require("passport")
var LocalStrategy= require("passport-local")
var passportLocalMongoose = require("passport-local-mongoose")
var methodOverride = require('method-override')
var session = require("express-session")

app.set("view engine", "ejs")
app.use(express.static("puplic"))
app.use(methodOverride('_method'))
app.use(flash())
// ===================================================================================================================
var mongoose = require("mongoose")
mongoose.Promise = global.Promise
mongoose.connect("mongodb://localhost/YelpCamp", {
  useMongoClient: true,

})
app.use(session({
  secret : "I Love>O football",
  resave : false,
  saveUninitialized : false
}))

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(function (req ,res , next) {
  res.locals.User = req.user ;
  res.locals.success = req.flash("success")
  res.locals.warning = req.flash("warning")
  next();
})
// ===========================================================================

app.get("/", function(req, res) {
  res.render("landing")
})
app.get("/campgrounds", function(req, res) {
  campgrounds.find({}, function(err, campground) {
    if (err) {
      console.log(err)
    } else {
      res.render("campgrounds", {
        campgrounds: campground
      })
    }
  })


})
app.get("/new/campground", isLoggedIn,function(req, res) {
  res.render("new")
})
app.post("/campgrounds", function(req, res) {
  var name = req.body.name;
  var image = req.body.image;
  var description = req.body.description;
  var author = {
    id:req.user._id,
    username:req.user.username
  }
  var container = {
    name: name,
    image: image,
    description: description,
    author:author
  }
  campgrounds.create(
    container,
    function(err, newlyCreated) {
      if (err) {
        console.log(err)
      } else {
        res.redirect("/campgrounds")
      }
    })

})
app.get("/campgrounds/:id", function(req, res) {
  campgrounds.findById(req.params.id).populate("comments").exec(function(err, camp) {
    if (err) {
      console.log(err)
    } else {
      res.render("show", {
        campground: camp
      });
    }

  })

})

app.get("/campgrounds/:id/newcomment",isLoggedIn, function(req, res) {
  campgrounds.findById(req.params.id ,function(err, camp) {
    if (err) {
      console.log(err)
    } else {
      res.render("comment", {campground : camp})
    }

  })

})

app.post("/campgrounds/:id/comments" , function (req , res) {

  var data = {author:{
    id: req.user._id ,
    username : req.user.username
  }, content : req.body.comment}
  campgrounds.findById(req.params.id ,function(err ,camp ) {
    if (err) {
      console.log(err);
    }else {
      comments.create(data, function (err , comment) {
        if (err) {
          console.log(err);
        }else {
          camp.comments.push(comment)
          camp.save();
          res.redirect("/campgrounds/" + camp._id)
        }

      })


    }

  })

})




app.get("/register" , function (req , res) {
  res.render("register")

})
app.post("/register" , function (req ,res) {
  User.register(new User({username : req.body.username}) , req.body.password , function (err , user) {
if (err) {
  console.log(err);
  return  req.flash("warning" , "this username has already taken ") , res.redirect("/register")


} passport.authenticate("local" )( req , res , function() {
  req.flash("success", "you are successfully Signed in Hello " + req.user.username + "!")
  res.redirect("/campgrounds")
})
  })

})

app.get('/login' , function (req, res) {
  res.render("login")
})

app.post("/login" , passport.authenticate("local" , {
  successRedirect: "/campgrounds",
  failureRedirect: "/login"
}) , function (req , res) {

})
app.get("/logout" , function (req ,res) {
  req.logout()
  req.flash("success" , "you successfuly log out")
  res.redirect("/")
})

app.get("/campgrounds/:id/ubdatecampground" ,isLoggedIn, function (req , res) {
  campgrounds.findById(req.params.id , function (err , camp) {
    if (err) {
      console.log(err);
    }else {


               if (req.user.username == camp.author.username) {
                 res.render("ubdate" , {camp : camp})
               }else{
                 res.send("your are a fool to think you can hacker me")
               }

    }
  })
})

app.put('/campgrounds/:id' ,  function (req , res) {
  var edit = { name: req.body.name , image:  req.body.image , description:  req.body.description }
campgrounds.findByIdAndUpdate(req.params.id ,   edit , function(err , camp) {
    if (err) {
      console.log(err);
    }else{
      res.redirect("/campgrounds/" + camp._id)
    }
  } )

})

app.delete('/campgrounds/:id' , function (req , res) {

  campgrounds.findByIdAndRemove( req.params.id , function (err) {
    if (err) {console.log(err);}
else {
 res.redirect("/campgrounds")




}  })
})

app.get("/campgrounds/:id/comments/:com/ubdatecomment" ,isLoggedIn, function (req , res) {
campgrounds.findById(req.params.id , function (err , camp) {
  if (err) {
    console.log(err);
  }else {
    comments.findById(req.params.com , function (err , com) {
      if (err) {
        console.log(err);
      }else {


                 if (req.user.username == com.author.username) {
                   res.render("edit" , {comment : com , campground: camp})
                 }else{
                   res.send("your are a fool to think you can hacker me")
                 }

      }
    })
  }
})



})

app.put("/campgrounds/:id/comments/:com",  function (req , res) {
var edit = {content : req.body.content}
comments.findByIdAndUpdate(req.params.com , edit ,function(err , comment){
  if(err){
    console.log(err);
  }else {
    campgrounds.findById(req.params.id , function (err , camp) {
      if (err) {
        console.log(err);
      }else {
        res.redirect("/campgrounds/" + camp.id)
      }
    })

  }
} )
    }
  )

app.delete('/campgrounds/:id/comments/:com' , isLoggedIn, function (req , res) {
    comments.findById(req.params.com , function (err ,  newcomment) {
      if (err) {
        console.log(err);
      }else {
        if (req.user.username == newcomment.author.username) {
          comments.findByIdAndRemove( req.params.com , function (err) {
            if (err) {console.log(err);}
        else {
          campgrounds.findById(req.params.id , function (err , camp) {
            if (err) {
              console.log(err);
            }else {
              res.redirect("/campgrounds/" + camp.id)
            }
          })




        }  })

        }
        else {
          res.send("you are fool to think you can hacker me")
        }
      }
    })

})


function isLoggedIn(req , res , next) {
  if(req.isAuthenticated()){
    return next();
  }
  req.flash("warning" , "Please log in")
  res.redirect("/login")

}



app.listen(3000, function() {
  console.log("the port you are listening in is 3000");

})
