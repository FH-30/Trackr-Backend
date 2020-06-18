const scheduler = require("node-schedule");
                
const schedule = (label, date, toDo) => {
    if (new Date() <= date) {
        scheduler.scheduleJob(label, date, toDo);
    }
}

const cancelSchedule = (label) => {
    if (scheduler.scheduledJobs[label]) {
        scheduler.scheduledJobs[label].cancel();
    }
}

module.exports = {
    schedule,
    cancelSchedule
}