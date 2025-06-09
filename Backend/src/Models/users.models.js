import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String
  },
  mobileNo: {
    type: Number,
    unique: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  isOnline:
  {
    type: Boolean,
    default: false
  }

}, { timestamps: true })

const userModel = mongoose.model("user", userSchema)
export default userModel