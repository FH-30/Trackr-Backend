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

const cancelAllSchedules = () => {
    const obj = scheduler.scheduledJobs;
    for (const label in obj){
        if (Object.prototype.hasOwnProperty.call(obj, label)) {
            cancelSchedule(label);
        }
    }
}

module.exports = {
    schedule,
    cancelSchedule,
    cancelAllSchedules
}