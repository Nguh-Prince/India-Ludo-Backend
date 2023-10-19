import mongoose from 'mongoose';
const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
  },
);
export default mongoose.model('role', RoleSchema);