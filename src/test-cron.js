import { CronJob } from 'cron'

// # ┌───────────── min (0 - 59)
// # │ ┌────────────── hour (0 - 23)
// # │ │ ┌─────────────── day of month (1 - 31)
// # │ │ │ ┌──────────────── month (1 - 12)
// # │ │ │ │ ┌───────────────── day of week (0 - 6) (0 to 6 are Sunday to Saturday, or use names; 7 is Sunday, the same as 0)
// # │ │ │ │ │
// # │ │ │ │ │
// # * * * * *  command to execute

new CronJob('*/5 * * * * *', () => {
  console.log('hihi')
}, () => {
  console.log('job done')
}, true)
