const config = require('./utils/config');
const puppie = require('./utils/puppie');

const app = require('./app');

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

puppie.init();
