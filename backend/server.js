import dotenv from 'dotenv';dotenv.config({path:new URL('./.env',import.meta.url).pathname});dotenv.config();
import mongoose from 'mongoose';import cron from 'node-cron';
import {app} from './src/app.js';import {startBot,stopBot,notify} from './src/bot.js';import {User,Subscription,SiteSettings,Notice} from './src/models.js';import {seedPlans} from './src/premium.js';
for(const key of ['BOT_TOKEN','MONGO_URI','JWT_SECRET','ADMIN_IDS'])if(!process.env[key]||['TELEGRAM_BOT_TOKENING','GENERATE_LONG_RANDOM_SECRET'].includes(process.env[key])){console.error(`❌ .env ichida ${key} ni sozlang`);process.exit(1)}
if(process.env.JWT_SECRET.length<32){console.error('JWT_SECRET kamida 32 belgidan iborat bo‘lishi kerak');process.exit(1)}
let server;
async function start(){await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:15000});console.log('✅ MongoDB ulandi');await seedPlans();await SiteSettings.updateOne({key:'main'},{$setOnInsert:{key:'main'}},{upsert:true});
 server=app.listen(Number(process.env.PORT)||5000,()=>console.log(`✅ API http://localhost:${process.env.PORT||5000}`));try{await startBot()}catch(e){console.error('Bot ishga tushmadi:',e.message)}
 cron.schedule('*/10 * * * *',async()=>{try{const now=new Date();const expired=await User.find({premiumUntil:{$lte:now,$gt:new Date(0)},premiumPlan:{$ne:''}}).limit(100);for(const u of expired){u.premiumPlan='';await u.save();await Subscription.updateMany({userId:u._id,status:'active'},{$set:{status:'expired'}});await Notice.create({userId:u._id,title:'Premium muddati tugadi',body:'Premium obunangizni yangilang.'});await notify(u.telegramId,'⏰ BEY ANIME Premium obunangiz muddati tugadi!')}}catch(e){console.error('Expiry job:',e.message)}});
}
start().catch(e=>{console.error('❌ Server xatosi:',e.message);process.exit(1)});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{stopBot();server?.close();await mongoose.disconnect();process.exit(0)});
