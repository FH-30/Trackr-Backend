// Import statements
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const isEmpty = require("is-empty");
const Validator = require("validator");
const QuickSort = require("optimized-quicksort");
const moment = require("moment");
const axios = require('axios').default;
const url = require("url");
const labeller = require("../../config/labeller");

// Functions to validate signin/signup
const validateSignUpInput = require("../../validation/signup");
const validateSignInInput = require("../../validation/signin");
const validateJobInput = require("../../validation/job");
const validateCredentialInput = require("../../validation/credential");
const sendEmail = require("../../config/email");
const scheduler = require("../../config/scheduler");
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
                        password: req.body.password,
                        usernameSet: true
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
                                .then(user => {
                                    const payload = {
                                        id: user.id,
                                        username: user.username
                                    };

                                    jwt.sign(
                                        payload,
                                        keys.refreshSecret,
                                        {
                                            expiresIn: 10800 // 3 hours in seconds
                                        },
                                        (err , token) => {
                                            const refreshToken = "Bearer " + token;

                                            User.findOneAndUpdate({username: user.username}, {$set: {refreshToken}}, {new: true}, (err, updatedUser) => {
                                                jwt.sign(
                                                    payload,
                                                    keys.authSecret,
                                                    {
                                                        expiresIn: 900 // 15 minutes in seconds
                                                    },
                                                    (err , token) => {
                                                        res.json({
                                                            user: {username: user.username, email: user.email},
                                                            success: true,
                                                            authToken: "Bearer " + token,
                                                            refreshToken
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
                                                )
                                            });
                                        }
                                    );
                                }).catch(err => {
                                    return res.json({err});
                                });
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
                if (!user.verified) {
                    return res.status(401).json({error: "Email is not verified"});
                }
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
            User.findOne({_id: data.id}).then(user => {
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
            User.findOne({_id: data.id}).then(user => {
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

router.get("/logo/:companyName", (req, res) => {
    const token = getJWT(req.headers);
    const originalAT = axios.defaults.headers.common['Authorization'];
    jwt.verify(token,
        keys.authSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            axios.defaults.headers.common['Authorization'] = "Bearer " + keys.clearBitAPIKey;
            axios.get(`https://company.clearbit.com/v1/domains/find?name=${req.params.companyName}`).then(response => {
                return res.json({logo: response.data.logo});
            }).catch(err => {
                return res.json(err);
            }).finally(() => {
                axios.defaults.headers.common['Authorization'] = originalAT;
            });
        });
});

router.get("/companyPredictions/:input", (req, res) => {
    const token = getJWT(req.headers);
    const originalAT = axios.defaults.headers.common['Authorization'];
    jwt.verify(token,
        keys.authSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            axios.defaults.headers.common['Authorization'] = "Bearer " + keys.clearBitAPIKey;
            axios.get(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${req.params.input}`).then(response => {
                return res.json(response.data);
            }).catch(err => {
                return res.json(err);
            }).finally(() => {
                axios.defaults.headers.common['Authorization'] = originalAT;
            });
        });
});

router.get("/linkedin", (req, res) => {
    const userID = req.query.id; // objectID of present Trackr account
    if (req.query.error && req.query.error_description) { // user cancelled linkedin login/authorization
        if (userID) {
            return res.redirect("http://localhost:3000/temporaryPage"); // redirect back to sync account page
        }
        return res.redirect("http://localhost:3000/login"); // redirect back to signin page
    }
    const redirect_uri = "http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fusers%2Flinkedin"
    if (userID) {
        redirect_uri += `%3Fid%3D${userID}`;
    }
    axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
    axios.post(`https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code` + 
    `&code=${req.query.code}&redirect_uri=${redirect_uri}` +
    `&client_id=86zqfh241jqet5&client_secret=HZtJSVgrSWU0Hzhi`).then(response => {
        const linkedInAT = response.data.access_token
        axios.defaults.headers.common['Authorization'] = "Bearer " + linkedInAT;
        axios.get("https://api.linkedin.com/v2/me").then(response => {
            const linkedInUser = response.data;
            if (userID) {
                // userID present if user syncing existing trackr account with his/her linkedin account
                User.findOne({linkedInID: linkedInUser.id}).then(user => {
                    if (user) {
                        return res.status(400).json({error: "LinkedIn Account already in use"});
                    }
                    User.findOneAndUpdate({_id: userID}, {$set: {linkedInID: linkedInUser.id, linkedInAT}}, {new: true}, (err, updatedUser) => {
                        if (!updatedUser) {
                            return res.status(404).json({data: "User of specified Data not present in Database"});
                        }
                        return res.redirect("http://localhost:3000/temporaryPage"); // redirect back to sync account page
                    });
                });
            } else {
                User.findOne({linkedInID: linkedInUser.id}).then(user => {
                    if (!user) {
                        axios.get("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))").then(response => {
                            const emailData = response.data;
                            const newUser = new User({
                                username: labeller.label(),
                                email: emailData.elements[0]["handle~"].emailAddress,
                                linkedInID: linkedInUser.id,
                                verified: true,
                                linkedInAT
                            });

                            newUser
                                .save()
                                .then(user => {
                                    const payload = {
                                        id: user.id,
                                        username: user.username
                                    };
                                    jwt.sign(
                                        payload,
                                        keys.refreshSecret,
                                        {
                                            expiresIn: 10800 // 3 hours in seconds
                                        },
                                        (err, token) => {
                                            const refreshToken = "Bearer " + token;
                
                                            jwt.sign(
                                                payload,
                                                keys.authSecret,
                                                {
                                                    expiresIn: 900 // 15 minutes in seconds
                                                },
                                                (err, token) => {
                                                    const authToken = "Bearer " + token;

                                                    User.findOneAndUpdate({linkedInID: user.linkedInID}, {$set: {refreshToken}}, {new: true}, (err, updatedUser) => {
                                                        return res.redirect(url.format({
                                                            pathname:"http://localhost:3000/temporaryPage", // redirect to ask username page
                                                            query: {
                                                                "authToken": authToken,
                                                                "refreshToken": refreshToken
                                                            }
                                                        }));
                                                    });
                                                }
                                            )
                                        }
                                    )
                                }).catch(err => {
                                    return res.json({err});
                                });
                        })
                    } else {
                        const payload = {
                            id: user.id,
                        }
                        if (user.usernameSet) {
                            payload.username = user.username;
                        }
                        jwt.sign(
                            payload,
                            keys.refreshSecret,
                            {
                                expiresIn: 10800 // 3 hours in seconds
                            },
                            (err, token) => {
                                const refreshToken = "Bearer " + token;

                                jwt.sign(
                                    payload,
                                    keys.authSecret,
                                    {
                                        expiresIn: 900 // 15 minutes in seconds
                                    },
                                    (err, token) => {
                                        const authToken = "Bearer " + token;

                                        User.findOneAndUpdate({linkedInID: user.linkedInID}, {$set: {refreshToken, linkedInAT}}, {new: true}, (err, updatedUser) => {
                                            if (!updatedUser.usernameSet) {
                                                return res.redirect(url.format({
                                                    pathname:"http://localhost:3000/temporaryPage", // redirect to ask username page
                                                    query: {
                                                        "authToken": authToken,
                                                        "refreshToken": refreshToken
                                                    }
                                                }));
                                            }
                                            return res.redirect(url.format({
                                                pathname:"http://localhost:3000/temporaryPage", // redirect to signed in page
                                                query: {
                                                    "authToken": authToken,
                                                    "refreshToken": refreshToken,
                                                    "username": updatedUser.username
                                                }
                                            }));
                                        });
                                    }
                                )
                            }
                        );
                    }
                });
            }
        }).catch(err => {
            return res.json(err);
        })
    }).catch(err => {
        return res.json(err);
    })
});

router.get("/sortedJobs", (req, res) => {
    const token = getJWT(req.headers);
    const weekly = req.query.weekly;

    jwt.verify(
        token,
        keys.authSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            User.findOne({_id: data.id}).then(user => {
                if (!user) {
                    return res.status(404).json({data: "User of specified Data not present in Database"});
                } else {
                    const jobs = user.jobs;

                    const getWeeklyJobs = (allJobs) => {
                        const startOfWeek = moment().startOf('isoweek').toDate();  
                        const endOfWeek   = moment().endOf('isoweek').toDate();

                        return allJobs.filter(job => {
                            if (new Date(job.interviewDate) >= startOfWeek && new Date(job.interviewDate) <= endOfWeek) {
                                return true;
                            }
                            return false;
                        });
                    }

                    if (user.jobsSorted) {
                        if (weekly) {
                            const filteredJobs = getWeeklyJobs(jobs);
                            return res.json({jobs: filteredJobs});
                        }
                        return res.json({jobs});
                    }

                    const comparator = (job1, job2) => {
                        const date1 = new Date(job1.interviewDate);
                        const date2 = new Date(job2.interviewDate);

                        if (date1 < date2) {
                            return -1;
                        } else {
                            return 1;
                        }
                    }

                    QuickSort.sort(jobs, comparator);

                    User.findOneAndUpdate({_id: data.id}, {$set: {jobs, jobsSorted: true}}, {new: true}, (err, updatedUser) => {
                        if (err) {
                            return res.status(400).json(err);
                        }
                        if (weekly) {
                            const filteredJobs = getWeeklyJobs(updatedUser.jobs);
                            return res.json({jobs: filteredJobs});
                        }
                        return res.json({jobs: updatedUser.jobs});
                    })
                }
            })
        }
    )
});

router.get("/emailVerification/:token", (req, res) => {
    const token = req.params.token;
    
    jwt.verify(
        token,
        keys.emailSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            User.findOneAndUpdate({_id: data.id}, {$set: {verified: true}}, {new: true}, (err, updatedUser) => {
                if (updatedUser === null) {
                    return res.status(404).json({error: "User of specified Username not present in Database"});
                }
                res.redirect("http://localhost:3000/login");
            });
        }
    )
});

router.get("/resetPassword/:token", (req, res) => {
    const token = req.params.token;

    jwt.verify(
        token,
        keys.emailSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }

            const payload = {
                id: data.id
            }

            jwt.sign(
                payload,
                keys.authSecret,
                (err, token) => {
                    const authToken = "Bearer " + token;

                    return res.redirect(url.format({
                        pathname:"http://localhost:3000/login", // password recovery email page
                        query: {
                            "authToken": authToken,
                        }
                    }));
                }
            )
        }
    );
});

router.get("/changeEmail/:token", (req, res) => {
    const token = req.params.token;
    
    jwt.verify(
        token,
        keys.emailSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            User.findOneAndUpdate({_id: data.id}, {$set: {email: data.email}}, {new: true}, (err, updatedUser) => {
                if (updatedUser === null) {
                    return res.status(404).json({error: "User of specified Username not present in Database"});
                }
                scheduler.cancelAllSchedules();

                const toSchedule = (emailSubject, emailHTML) => {
                    sendEmail(data.email, emailSubject, emailHTML);
                }

                const schedule = (job) => {
                    const oneDayMiliseconds = 60 * 60 * 24 * 1000;
                    const futureDate = new Date(new Date(job.interviewDate) - oneDayMiliseconds);

                    let emailSubject = "";
                    let emailHTML = "";

                    if (job.status === "toApply") {
                        emailSubject = `REMINDER: To apply at ${job.company} for ${job.role} position`;
                        emailHTML = `<p>The application portal at ${job.company} for ${job.role} position is closing in 24 hours! Be sure to apply for it by then!</P>`;
                    } else if (job.status === "interview") {
                        emailSubject = `REMINDER: Interview with ${job.company} for ${job.role} position`;
                        emailHTML = `<p>Your interview with ${job.company} for ${job.role} position is happening in 24 hours! Be sure to prepare for it!</P>`;
                    } else {
                        emailSubject = `REMINDER: To respond to offer from ${job.company} for ${job.role} position`;;
                        emailHTML = `<p>You have 24 hours left to respond to your offer from ${job.company} for ${job.role} position! Be sure to respond by then!</P>`;
                    }
                    scheduler.schedule(job.id, futureDate, () => toSchedule(emailSubject, emailHTML));
                }

                updatedUser.jobs.map(job => {
                    schedule(job);
                });

                res.redirect("http://localhost:3000/login"); // email successfully changed page
            });
        }
    )
});

router.get("/sendVerificationEmail", (req, res) => {
    const token = getJWT(req.headers);
    const newEmail = req.query.email;
    const emptyNewEmail = newEmail === "";

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

            if (newEmail) {
                payload.email = newEmail;
            }

            jwt.sign(
                payload,
                keys.emailSecret,
                {
                    expiresIn: 900 // 15 minutes in seconds
                },
                (err, token) => {
                    User.findOne({_id: data.id}).then(user => {
                        let emailSubject;
                        let emailHTML;
    
                        if (newEmail || emptyNewEmail) {
                            const {errors, isValid} = validateCredentialInput({email: newEmail}, "email");

                            if (!isValid) {
                                return res.status(400).json(errors);
                            }

                            if (user.email === newEmail) {
                                return res.status(400).json({email: `Cannot change to the same email address`});
                            }

                            User.findOne({email: newEmail}).then(user => {
                                if (user) {
                                    return res.status(400).json({email: `That email is already taken`})
                                }
    
                                emailSubject = `Change Your Email: Link expires in 15 minutes`;
                                emailHTML = `<p>Click on the link below to change your email:
                                                    http://localhost:5000/api/users/changeEmail/${token}</p>`;
                                sendEmail(newEmail, emailSubject, emailHTML);
                                return res.json({});
                            });
                        } else {
                            emailSubject = `Verify Your Email: Link expires in 15 minutes`;
                            emailHTML = `<p>Click on the link below to verify your email:
                                                http://localhost:5000/api/users/emailVerification/${token}</p>`;
                            sendEmail(user.email, emailSubject, emailHTML);
                            return res.json({});
                        }
                    });
                }
            );
        }
    )
});

router.get("/sendPasswordRecoveryEmail/:usernameOrEmail", (req, res) => {
    let usernameOrEmail = req.params.usernameOrEmail;

    let validation;
    let toFind;
    let field;

    usernameOrEmail = isEmpty(usernameOrEmail) ? "" : usernameOrEmail;

    if (Validator.isEmail(usernameOrEmail)) {
        field = "email";
        toFind = {email: usernameOrEmail};
        validation = validateCredentialInput(toFind, "email");
    } else {
        field = "username";
        toFind = {username: usernameOrEmail};
        validation = validateCredentialInput(toFind, "username");
    }

    const {errors, isValid} = validation;

    if (!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne(toFind).then(user => {
        if (!user) {
            return res.status(404).json({error: `User of specified ${field} not present in Database`});
        }

        const payload = {
            id: user.id,
            username: user.username
        };

        jwt.sign(
            payload,
            keys.emailSecret,
            {
                expiresIn: 900 // 15 minutes in seconds
            },
            (err, token) => {
                const emailSubject = `Reset Your Password: Link expires in 15 minutes`;
                const emailHTML = `<p>Click on the link below to reset your password:
                                    http://localhost:5000/api/users/resetPassword/${token}</p>`;

                sendEmail(user.email, emailSubject, emailHTML);
                return res.json({});
            }
        );
    });
});

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

            const toSet = {jobs: req.body.jobs};

            if (req.body.add || req.body.updated) {
                toSet.jobsSorted = false;
            }

            let metrics;

            User.findOneAndUpdate({_id: data.id}, {$set: toSet}, {new: true}, (err, updatedUser) => {
                if (err) {
                    return res.status(400).json(err);
                } else {
                    if (updatedUser === null) {
                        return res.status(404).json({error: "User of specified Username not present in Database"});
                    }

                    metrics = updatedUser.metrics;

                    const cancelSchedule = () => {
                        scheduler.cancelSchedule(updatedJob.id);
                    }
                    if (hasInterviewDate && updatedJob.status !== "applied") {
                        if (req.body.delete) {
                            cancelSchedule();
                        } else {
                            const oneDayMiliseconds = 60 * 60 * 24 * 1000;
                            const futureDate = new Date(new Date(updatedJob.interviewDate) - oneDayMiliseconds);
                            const toSchedule = (emailSubject, emailHTML) => {
                                sendEmail(updatedUser.email, emailSubject, emailHTML);
                            }
                            const schedule = () => {
                                let emailSubject = "";
                                let emailHTML = "";
                                if (updatedJob.status === "toApply") {
                                    emailSubject = `REMINDER: To apply at ${updatedJob.company} for ${updatedJob.role} position`;
                                    emailHTML = `<p>The application portal at ${updatedJob.company} for ${updatedJob.role} position is closing in 24 hours! Be sure to apply for it by then!</P>`;
                                } else if (updatedJob.status === "interview") {
                                    emailSubject = `REMINDER: Interview with ${updatedJob.company} for ${updatedJob.role} position`;
                                    emailHTML = `<p>Your interview with ${updatedJob.company} for ${updatedJob.role} position is happening in 24 hours! Be sure to prepare for it!</P>`;
                                } else {
                                    emailSubject = `REMINDER: To respond to offer from ${updatedJob.company} for ${updatedJob.role} position`;;
                                    emailHTML = `<p>You have 24 hours left to respond to your offer from ${updatedJob.company} for ${updatedJob.role} position! Be sure to respond by then!</P>`;
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

                    if (req.body.add) {
                        metrics[updatedJob.status] += 1;
                    } else if (req.body.updated) {
                        metrics[updatedJob.oldStatus] -= 1;
                        metrics[updatedJob.status] += 1;
                    } else {
                        metrics[updatedJob.status] -= 1;
                    }

                    User.findOneAndUpdate({_id: data.id}, {$set: {metrics}}, {new: true}, (err, updatedUser) => {
                        updatedUser.refreshToken = undefined;
                        return res.json(updatedUser);
                    });
                }
            });
        }
    );
});

router.put("/username", (req, res) => {
    const token = getJWT(req.headers);
    
    jwt.verify(token, 
        keys.authSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            
            const {errors, isValid} = validateCredentialInput(req.body, "username");

            if (!isValid) {
                return res.status(400).json(errors);
            }

            let toSet = {username: req.body.username};

            User.findOne(toSet).then(user => {
                if (user) {
                    return res.status(400).json({error: `That username is already taken`})
                }

                toSet.usernameSet = true;

                User.findOneAndUpdate({_id: data.id}, {$set: toSet}, {new: true}, (err, updatedUser) => {
                    if (err) {
                        return res.status(400).json(err);
                    }
                    if (updatedUser === null) {
                        return res.status(404).json({error: "User of specified Username not present in Database"});
                    }
                    updatedUser.refreshToken = undefined;
                    return res.json(updatedUser);
                });

            })
        }
    );
});

router.put("/password", async (req, res) => {
    const token = getJWT(req.headers);
    let recoveryEmail = req.query.recovery;
    
    jwt.verify(token, 
        keys.authSecret,
        (err, data) => {
            if (err) {
                return res.status(401).json(err);
            }
            
            let {errors, isValid} = validateCredentialInput(req.body, "password");

            if (!recoveryEmail) {
                let oldPassword = req.body.oldPassword;

                oldPassword = isEmpty(oldPassword) ? "" : oldPassword;

                if (Validator.isEmpty(oldPassword)) {
                    errors.oldPassword = "Old password field is required";
                }

                isValid = isEmpty(errors);
            }

            if (!isValid) {
                return res.status(400).json(errors);
            }

            User.findOne({_id: data.id}).then(user => {
                if (recoveryEmail) {
                    req.body.oldPassword = "";
                }
                bcrypt.compare(req.body.oldPassword, user.password).then(async (isMatch) => {
                    if (!recoveryEmail && !isMatch) {
                        return res.status(400).json({oldPassword: "Old password incorrect"})
                    }

                    req.body.newPassword = await new Promise((resolve, reject) => { 
                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(req.body.newPassword, salt, (err, hash) => {
                                if (err) {
                                    reject(err);
                                }
                                resolve(hash); 
                            });
                        });
                    });

                    let toSet = {password: req.body.newPassword};

                    User.findOneAndUpdate({_id: data.id}, {$set: toSet}, {new: true}, (err, updatedUser) => {
                        if (err) {
                            return res.status(400).json(err);
                        }
                        if (updatedUser === null) {
                            return res.status(404).json({error: "User of specified Username not present in Database"});
                        }
                        updatedUser.refreshToken = undefined;
                        return res.json(updatedUser);
                    });
                });
            })
        }
    );
});


module.exports = router;