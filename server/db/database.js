const mongoose = require('mongoose');
require('colors'); 

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {});

    console.log(
      `Connected to MongoDB Database: ${mongoose.connection.host}`.bgBrightGreen.black
    );
  } catch (err) {
    console.log(`MongoDB Database Error: ${err}`.bgBrightRed.white);
    process.exit(1);
  }
};

module.exports = connectDB;
