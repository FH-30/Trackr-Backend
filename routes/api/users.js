// Import statements
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../Config/keys");
const isEmpty = require("is-empty");

// Functions to validate signin/signup
const validateSignUpInput = require("../../validation/signup");
const validateSignInInput = require("../../validation/signin");

// Load User model (Using Schema made in another file)
const User = require("../../models/User");

// @route POST api/users/register
// @desc Sign Up user
// @access Public
router.post("/signup", (req, res) => {

    // Form validation
    const {errors, isValid} = validateSignUpInput(req.body);

    // Check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    const err = {};

    User.findOne({
        email: req.body.email
    }).then(user => {
        if (user) {
            err.email = "Email already exists";
        }
        
        User.findOne({
            username: req.body.username
        }).then(user => {
            if (user) {
                err.username = "Username already exists";
            } else {
                if (isEmpty(err)) {
                    const newUser = new User({
                        username: req.body.username,
                        email: req.body.email,
                        password: req.body.password
                    });
    
                    //Hash Password before storing in database
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) {
                                throw err;
                            }
                            newUser.password = hash;
                            newUser.jobs = [];
                            newUser
                                .save()
                                .then(user => res.json(user))
                                .catch(err => console.log(err));
                        });
                    });
                }
            }
            if (!isEmpty(err)) {
                return res.status(400).json(err);
            }
        });
    });
});

// @route POST api/users/login
// @desc Sign In user and return JWT token
// @access Public
router.post("/signin", (req, res) => {

    //Form Validation
    const {errors, isValid, isEmail} = validateSignInInput(req.body);

    // Check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    const usernameOrEmail = req.body.usernameOrEmail
    const password = req.body.password;

    let getCredential = null;
    if (isEmail) {
        getCredential = User.findOne({email: usernameOrEmail});
    } else {
        getCredential = User.findOne({username: usernameOrEmail});
    }
    getCredential.then(user => {
        if (!user) {
            if (isEmail) {
                return res.status(400).json({email: "Email not found"});
            } else {
                return res.status(400).json({username: "Username not found"});
            }
        }

        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
              const payload = {
                id: user.id,
                username: user.username
              }
            
            jwt.sign(
                payload,
                keys.secretOrKey,
                {
                  expiresIn: 31556926 // 1 year in seconds
                },
                (err, token) => {
                  res.json({
                    user,
                    success: true,
                    token: "Bearer " + token
                  });
                }
              );
            } else {
              return res
                .status(400)
                .json({ passwordincorrect: "Password incorrect" });
            }
        });
    });
});

router.get("/", (req, res) => {
    User.findOne(req.body.data).then(user => {
        if (!user) {
            return res.status(404).json({data: "User of specified Data not present in Database"});
        } else {
            return res.json(user);
        }
    })
})

router.put("/", async (req, res) => {
    const newPassword = req.body.update.password;
    if (newPassword !== undefined) {
        req.body.update.password = await new Promise((resolve, reject) => { 
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newPassword, salt, (err, hash) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(hash); 
                });
            });
        });
    }
    User.findOneAndUpdate({username: req.body.username}, {$set: req.body.update}, {new: true}, (err, updatedUser) => {
        if (err) {
            if (err.codeName === "DuplicateKey") {
                return res.status(400).json({msg: "Another User already has the Field passed in", isDuplicate: true})
            }
            err.isDuplicate = false;
            return res.status(400).json(err);
        } else {
            if (updatedUser === null) {
                return res.status(404).json({data: "User of specified Username not present in Database"});
            }
            return res.json(updatedUser);
        }
    });
});

module.exports = router;