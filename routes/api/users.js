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
const labeller = require("../../Config/labeller").label;
const sendEmail = require("../../Config/email");
const scheduler = require("../../Config/scheduler");

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
                  expiresIn: 300 // 5 minutes in seconds
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
    const updatedJob = req.body.updatedJob;
    const hasInterviewDate = !isEmpty(updatedJob.interviewDate);
    console.log(updatedJob);
    if (updatedJob.status === "applied" && hasInterviewDate) {
        return res.status(400).json({error: "Applied status shouldn't have any deadline date"});
    }
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
    const checkDuplicateAndGetJobToUpdate = () => {
        let first = true;
        const toReturn = {};
        toReturn.jobToUpdate = null;
        toReturn.duplicatePresent = false;
        req.body.update.jobs.map(job => {
            if (updatedJob.company === job.company && updatedJob.role === job.role) {
                if (first) {
                    first = false;
                    toReturn.jobToUpdate = job;
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
    const validation = checkDuplicateAndGetJobToUpdate();
    if (req.body.add || req.body.updated) {
        if (validation.duplicatePresent) {
            return res.status(400).json({error: "Job already in Dashboard", jobs: validation.removeDuplicateArr});
        }
        if (req.body.add) {
            const label = labeller(updatedJob);
            updatedJob.label = label;
            validation.jobToUpdate.label = label;
        }
        if (hasInterviewDate) {
            const eightHoursMiliseconds = 60 * 60 * 8 * 1000; // frontend time 8 hours ahead
            const reversedEightHoursDate = new Date(new Date(updatedJob.interviewDate) - eightHoursMiliseconds);
            validation.jobToUpdate.interviewDate = reversedEightHoursDate;
            updatedJob.interviewDate = reversedEightHoursDate;
        }
    }
    User.findOneAndUpdate({username: req.body.username}, {$set: req.body.update}, {new: true}, (err, updatedUser) => {
        if (err) {
            if (err.codeName === "DuplicateKey") {
                return res.status(400).json({error: "Another User already has the Field passed in", isDuplicate: true})
            }
            err.isDuplicate = false;
            return res.status(400).json(err);
        } else {
            if (hasInterviewDate) {
                if (updatedUser === null) {
                    return res.status(404).json({error: "User of specified Username not present in Database"});
                }
                const cancelSchedule = () => {
                    scheduler.cancelSchedule(updatedJob.label);
                }
                if (req.body.delete) {
                    cancelSchedule();
                } else {
                    const oneDayMiliseconds = 60 * 60 * 24 * 1000;
                    const thirtySecondsMiliseconds = 30 * 1000;
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
                        scheduler.schedule(updatedJob.label, futureDate, () => toSchedule(emailSubject, emailHTML));
                    }
                    if (req.body.add) {
                        schedule();
                    } else if (req.body.updated) {
                        cancelSchedule();
                        schedule();
                    }
                }
            }
            return res.json(updatedUser);
        }
    });
});

module.exports = router;