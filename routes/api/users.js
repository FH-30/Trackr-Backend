// Import statements
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../Config/keys");
const isEmpty = require("is-empty");
const Validator = require("validator");

// Functions to validate signin/signup
const validateSignUpInput = require("../../validation/signup");
const validateSignInInput = require("../../validation/signin");
const validateJobInput = require("../../validation/job");
const validateCredentialInput = require("../../validation/credential");
const sendEmail = require("../../Config/email");
const scheduler = require("../../Config/scheduler");
const getJWT = require("../../verification/getJWT");

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

                            const payload = {
                                username: newUser.username
                            }

                            jwt.sign(
                                payload,
                                keys.refreshSecret,
                                {
                                    expiresIn: 10800 // 3 hours in seconds
                                },
                                (err, token) => {
                                    const refreshToken = "Bearer " + token;
                                    newUser.refreshToken = refreshToken;

                                    newUser
                                        .save()
                                        .then(user => {
                                            const payload = {
                                                id: user.id,
                                                username: user.username
                                            }
                                
                                            jwt.sign(
                                                payload,
                                                keys.authSecret,
                                                {
                                                    expiresIn: 900 // 15 minutes in seconds
                                                },
                                                (err, token) => {
                                                    res.json({
                                                        user: {username: user.username, email: user.email},
                                                        success: true,
                                                        authToken: "Bearer " + token,
                                                        refreshToken: refreshToken
                                                    });
                                                    jwt.sign(
                                                        payload,
                                                        keys.emailSecret,
                                                        {
                                                            expiresIn: 900 // 15 minutes in seconds
                                                        },
                                                        (err, token) => {
                                                            const emailSubject = `Verify Your Email: Link expires in 15 minutes`;
                                                            const emailHTML = `<p>Click on the link below to verify your email:
                                                                                http://localhost:5000/api/users/emailVerification/${token}</p>`;
                                                            sendEmail(user.email, emailSubject, emailHTML);
                                                        }
                                                    )
                                                }
                                            );
                                        }
                                    )
                                    .catch(err => console.log(err));
                                }
                            )
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
                    keys.refreshSecret,
                    {
                        expiresIn: 10800 // 3 hours in seconds
                    },
                    (err, token) => {
                        const refreshToken = "Bearer " + token;

                        User.findOneAndUpdate({username: user.username}, {$set: {refreshToken}}, {new: true}, (err, updatedUser) => {
                            jwt.sign(
                                payload,
                                keys.authSecret,
                                {
                                    expiresIn: 900 // 15 minutes in seconds
                                },
                                (err, token) => {
                                    res.json({
                                        user: {username: updatedUser.username},
                                        success: true,
                                        authToken: "Bearer " + token,
                                        refreshToken: refreshToken 
                                    });
                                }
                            );
                        });
                    }
                )
            } else {
                return res
                        .status(400)
                        .json({ passwordincorrect: "Password incorrect" });
            }
        });
    });
});

router.post("/refreshAuthToken", (req, res) => {
    const token = getJWT(req.headers);
    jwt.verify(token,
        keys.refreshSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            User.findOne({username: data.username}).then(user => {
                const valid = user.refreshToken === "Bearer " + token;
                if (valid) {
                    const payload = {
                        id: user.id,
                        username: user.username
                    }

                    jwt.sign(
                        payload,
                        keys.authSecret,
                        {
                            expiresIn: 900 // 15 miutes in seconds
                        },
                        (err, token) => {
                            return res.json({authToken: "Bearer " + token});
                        }
                    )
                } else {
                    return res.status(401).json({error: "Refresh Token doesn't match token in database"});
                }
            })
        }
    );
});

router.get("/", (req, res) => {
    const token = getJWT(req.headers);
    jwt.verify(token, 
        keys.authSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            User.findOne({username: data.username}).then(user => {
                if (!user) {
                    return res.status(404).json({data: "User of specified Data not present in Database"});
                } else {
                    user.refreshToken = undefined;
                    return res.json(user);
                }
            })
        }
    );
});

router.get("/emailVerification/:token", (req, res) => {
    const token = req.params.token;
    
    jwt.verify(
        token,
        keys.emailSecret,
        (err, data) => {
            if (err) {
                return res.status(400).json(err);
            }
            User.findOneAndUpdate({username: data.username}, {$set: {verified: true}}, {new: true}, (err, updatedUser) => {
                if (updatedUser === null) {
                    return res.status(404).json({error: "User of specified Username not present in Database"});
                }
                res.redirect("http://localhost:3000/login");
            });
        }
    )
});

router.get("/sendVerificationEmail", (req, res) => {
    const token = getJWT(req.headers);

    jwt.verify(
        token,
        keys.authSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }

            const payload = {
                id: data.id,
                username: data.username
            }
            jwt.sign(
                payload,
                keys.emailSecret,
                {
                    expiresIn: 900 // 15 minutes in seconds
                },
                (err, token) => {
                    const emailSubject = `Verify Your Email: Link expires in 15 minutes`;
                    const emailHTML = `<p>Click on the link below to verify your email:
                                        http://localhost:5000/api/users/emailVerification/${token}</p>`;
                    User.findOne({username: data.username}).then(user => {
                        sendEmail(user.email, emailSubject, emailHTML);
                        return res.json({});
                    });
                }
            );
        }
    )
})

router.put("/jobs", (req, res) => {
    const token = getJWT(req.headers);
    jwt.verify(token, 
        keys.authSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            const updatedJob = req.body.updatedJob;

            const {errors, isValid, hasInterviewDate} = validateJobInput(updatedJob);
        
            if (!isValid) {
                return res.status(400).json(errors);
            }

            const checkDuplicate = () => {
                let first = true;
                const toReturn = {};
                toReturn.duplicatePresent = false;
                req.body.jobs.map(job => {
                    if (updatedJob.company === job.company && updatedJob.role === job.role) {
                        if (first) {
                            first = false;
                        } else {
                            toReturn.duplicatePresent = true;
                            let first = true;
                            toReturn.removeDuplicateArr = req.body.update.jobs.filter(job => {
                                const notDuplicate = updatedJob.company !== job.company && updatedJob.role !== job.role
                                if (!notDuplicate && first) {
                                    first = false;
                                    return true;
                                }
                                return notDuplicate;
                            });
                        }
                    }
                });
                return toReturn;
            }
            const validation = checkDuplicate();
            if (req.body.add || req.body.updated) {
                if (validation.duplicatePresent) {
                    return res.status(400).json({error: "Job already in Dashboard", jobs: validation.removeDuplicateArr});
                }
            }
            User.findOneAndUpdate({username: data.username}, {$set: {jobs: req.body.jobs}}, {new: true}, (err, updatedUser) => {
                if (err) {
                    return res.status(400).json(err);
                } else {
                    if (updatedUser === null) {
                        return res.status(404).json({error: "User of specified Username not present in Database"});
                    }
                    const cancelSchedule = () => {
                        scheduler.cancelSchedule(updatedJob.id);
                    }
                    if (hasInterviewDate) {
                        if (req.body.delete) {
                            cancelSchedule();
                        } else {
                            const oneDayMiliseconds = 60 * 60 * 24 * 1000;
                            const thirtySecondsMiliseconds = 30 * 1000; // for testing purposes
                            const futureDate = new Date(new Date(updatedJob.interviewDate) - thirtySecondsMiliseconds);
                            const toSchedule = (emailSubject, emailHTML) => {
                                sendEmail(updatedUser.email, emailSubject, emailHTML);
                            }
                            const schedule = () => {
                                let emailSubject = "";
                                let emailHTML = "";
                                if (updatedJob.status === "toApply") {
                                    emailSubject = `REMINDER: To apply at ${updatedJob.company} for ${updatedJob.role} position`;
                                    emailHTML = `<p>The application portal at ${updatedJob.company} for ${updatedJob.role} position is closing in 30 seconds! Be sure to apply for it by then!</P>`;
                                } else if (updatedJob.status === "interview") {
                                    emailSubject = `REMINDER: Interview with ${updatedJob.company} for ${updatedJob.role} position`;
                                    emailHTML = `<p>Your interview with ${updatedJob.company} for ${updatedJob.role} position is happening in 30 seconds! Be sure to prepare for it!</P>`;
                                } else {
                                    emailSubject = `REMINDER: To respond to offer from ${updatedJob.company} for ${updatedJob.role} position`;;
                                    emailHTML = `<p>You have 30 seconds left to respond to your offer from ${updatedJob.company} for ${updatedJob.role} position! Be sure to respond by then!</P>`;
                                }
                                scheduler.schedule(updatedJob.id, futureDate, () => toSchedule(emailSubject, emailHTML));
                            }
                            if (req.body.add) {
                                schedule();
                            } else if (req.body.updated) {
                                cancelSchedule();
                                schedule();
                            }
                        }
                    } else {
                        if (req.body.updated) {
                            cancelSchedule(); // In the case of an update there might have been a previously scheduled reminder
                        }
                    }
                    updatedUser.refreshToken = undefined;
                    return res.json(updatedUser);
                }
            });
        }
    );
});

router.put("/:field", (req, res) => {
    const field = req.params.field;

    if (field !== "username" && field !== "email" && field !== "password") {
        return res.status(404).json({error: "Page Not Found"});
    }

    const token = getJWT(req.headers);
    jwt.verify(token, 
        keys.authSecret,
        async (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            
            const {errors, isValid} = validateCredentialInput(req.body, field);

            if (!isValid) {
                return res.status(400).json(errors);
            }
        
            if (field === "password") {
                req.body.password = await new Promise((resolve, reject) => { 
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(req.body.password, salt, (err, hash) => {
                            if (err) {
                                reject(err);
                            }
                            resolve(hash); 
                        });
                    });
                });
            }

            let toSet;

            if (field === "username") {
                toSet = {username: req.body.username};
            } else if (field === "email") {
                toSet = {email: req.body.email};
            } else {
                toSet = {password: req.body.password};
            }

            User.findOneAndUpdate({username: data.username}, {$set: toSet}, {new: true}, (err, updatedUser) => {
                if (err) {
                    if (err.codeName === "DuplicateKey") {
                        return res.status(400).json({error: `That ${field} is already taken`, isDuplicate: true})
                    }
                    err.isDuplicate = false;
                    return res.status(400).json(err);
                }
                
                if (updatedUser === null) {
                    return res.status(404).json({error: "User of specified Username not present in Database"});
                }

                if (field === "username") {
                    const payload = {
                        id: updatedUser.id,
                        username: updatedUser.username
                    }
                    jwt.sign(
                        payload,
                        keys.refreshSecret,
                        {
                            expiresIn: 10800 // 3 hours in seconds
                        },
                        (err, token) => {
                            const refreshToken = "Bearer " + token;
    
                            User.findOneAndUpdate({username: updatedUser.username}, {$set: {refreshToken}}, {new: true}, (err, updatedUser) => {
                                jwt.sign(
                                    payload,
                                    keys.authSecret,
                                    {
                                        expiresIn: 900 // 15 minutes in seconds
                                    },
                                    (err, token) => {
                                        res.json({
                                            user: {username: updatedUser.username},
                                            success: true,
                                            authToken: "Bearer " + token,
                                            refreshToken: refreshToken
                                        });
                                    }
                                );
                            });
                        }
                    )
                } else {
                    updatedUser.refreshToken = undefined;
                    return res.json(updatedUser);
                }
            })
        }
    );
});

module.exports = router;