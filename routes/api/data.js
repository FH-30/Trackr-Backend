const express = require("express");
const router = express.Router();

const Data = require("../../models/Data");

router.post("/", (req, res) => {
    const newData = new Data({
        username: req.body.username,
        email: req.body.email,
        jobs: req.body.jobs
    });
    newData
        .save()
        .then(data => res.json(data))
        .catch(err => console.log(err));
});

module.exports = router;