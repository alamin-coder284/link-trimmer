import {createClient} from "redis";

const redisClient = createClient({
   url: process.env.REDIS_URL
});


 redisClient.on('error',(err) => {
   console.log("Redis Client error: "+err);
 });
 
 const connectRedis = async () => {
   try {
   await redisClient.connect();
   console.log('Redis connected!');
   } catch(err){
    console.log('Redis connection failed!');
   }
 }
 
 
 
   connectRedis();
 
export default redisClient;
 
 