const cron = require('node-cron');
const config = require('./utils/config');
const puppie = require('./utils/puppie');
const app = require('./app');

// Set up the cron job to run myFunction() every day at 10 am
cron.schedule('30 20 * * *', () => {
  puppie.enqueueAllTests();
}, { timezone: 'America/Bogota' });

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

puppie.init();
