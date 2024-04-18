// const cron = require('node-cron');
import cron from 'node-cron';
// const config = require('./utils/config');
import * as config from './utils/config.mjs';
import * as puppie from './utils/puppeteer/puppie.mjs';
// const app = require('./app');
import { app } from './app.mjs'

// Set up the cron job to run myFunction() every day at 10 am
cron.schedule('30 20 * * *', () => {
  puppie.enqueueAllTests();
}, { timezone: 'America/Bogota' });

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

puppie.init();
