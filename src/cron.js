import { CronJob } from 'cron'
import builder from './app'

const job = new CronJob('0 */5 * * * *', async () => {
  console.log(new Date())
  await builder()
}, () => {
  console.log('job done')
}, true)

job.start()
