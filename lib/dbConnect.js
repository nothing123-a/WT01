import connectDB from "./mongodb";

export default async function dbConnect() {
  return await connectDB();
}