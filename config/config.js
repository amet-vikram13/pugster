const env = "development";

if (env === "development") {
  let config = require('./config.json');
  let envConfig = config[env];

  Object.keys(envConfig).forEach((key)=>{
    process.env[key] = envConfig[key];
  });
}
