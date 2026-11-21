import {Telegraf,Markup} from 'telegraf';
import {User,Anime,PremiumRequest,PremiumPlan} from './models.js';
import {adminIds,ageOf,isAdmin,premium} from './security.js';
export let bot;
const appUrl=()=>process.env.WEBAPP_URL;
const menu=()=>Markup.keyboard([[Markup.button.webApp('🎬 Anime tomosha qilish',appUrl())],['🔥 Mashhur animelar','⭐ Premium'],['👤 Mening profilim','❤️ Sevimlilar'],['📞 Yordam']]).resize();
const clean=s=>String(s||'').replace(/[<>]/g,'').slice(0,90);
export async function startBot(){if(!process.env.BOT_TOKEN||process.env.BOT_TOKEN==='TELEGRAM_BOT_TOKENING'){console.warn('BOT_TOKEN kiritilmagan — bot ishga tushmadi');return}
 bot=new Telegraf(process.env.BOT_TOKEN);
 bot.start(async ctx=>{const id=String(ctx.from.id);let u=await User.findOne({telegramId:id});if(!u){u=await User.create({telegramId:id,username:ctx.from.username,firstName:ctx.from.first_name||'Foydalanuvchi',lastName:ctx.from.last_name||'',step:'warning'})}if(u.step==='done')return ctx.reply(`🎌 Xush kelibsiz, ${u.firstName}!`,menu());await ctx.reply('🎌 BEY ANIME olamiga xush kelibsiz!\n\n⚠️ Muhim ogohlantirish:\n18 yoshga to‘lmaganlarga kattalar kontenti ko‘rsatilmaydi. Ro‘yxatdan o‘tish uchun davom eting.',Markup.inlineKeyboard([Markup.button.callback('✅ Tushundim, davom etish','register')]))});
 bot.action('register',async ctx=>{await User.updateOne({telegramId:String(ctx.from.id)},{$set:{step:'first'}});await ctx.answerCbQuery();await ctx.reply('👤 Ismingizni kiriting:')});
 bot.command('profile',async ctx=>{const u=await User.findOne({telegramId:String(ctx.from.id)});return ctx.reply(u?`${u.firstName} ${u.lastName}\nID: ${u.telegramId}\nPremium: ${premium(u)?'Faol':'Yo‘q'}`:'Avval /start bosing')});
 bot.command('help',ctx=>ctx.reply('/start — Boshlash\n/profile — Profil\n/premium — Premium\n/admin — Boshqaruv'));
 bot.command('premium',ctx=>ctx.reply('👑 Premium olish uchun Mini App ni oching.',menu()));
 bot.command('admin',ctx=>adminIds().has(String(ctx.from.id))?ctx.reply('👑 Admin panel',Markup.inlineKeyboard([Markup.button.webApp('🛡 Admin panelni ochish',appUrl())])):ctx.reply('Ruxsat yo‘q'));
 bot.command('stats',async ctx=>{if(!adminIds().has(String(ctx.from.id)))return ctx.reply('Ruxsat yo‘q');const [users,anime,requests]=await Promise.all([User.countDocuments(),Anime.countDocuments(),PremiumRequest.countDocuments({status:'pending'})]);return ctx.reply(`📊 Foydalanuvchilar: ${users}\n🎬 Anime: ${anime}\n👑 So‘rovlar: ${requests}`)});
 bot.on('text',async (ctx,next)=>{const text=ctx.message.text.trim();let u=await User.findOne({telegramId:String(ctx.from.id)});if(!u)return ctx.reply('Avval /start bosing.');if(u.step==='first'){if(text.length<2||text.length>50)return ctx.reply('Ism 2–50 belgidan iborat bo‘lsin.');u.firstName=clean(text);u.step='last';await u.save();return ctx.reply('👥 Familiyangizni kiriting:')}
 if(u.step==='last'){if(text.length<2||text.length>50)return ctx.reply('Familiya 2–50 belgidan iborat bo‘lsin.');u.lastName=clean(text);u.step='dob';await u.save();return ctx.reply('🎂 Tug‘ilgan sanangizni KUN.OY.YIL ko‘rinishida kiriting (masalan, 15.04.2005):')}
 if(u.step==='dob'){const m=text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);if(!m)return ctx.reply('Sana formati: 15.04.2005');const d=new Date(Date.UTC(+m[3],+m[2]-1,+m[1]));if(d.getUTCDate()!==+m[1]||d.getUTCMonth()!==+m[2]-1||d>new Date()||d.getUTCFullYear()<1900)return ctx.reply('To‘g‘ri tug‘ilgan sanani kiriting.');u.dateOfBirth=d;u.step='done';await u.save();return ctx.reply(`🎉 Tabriklaymiz, ${u.firstName}! Profilingiz yaratildi.`,menu())}
 if(text==='👤 Mening profilim')return ctx.reply(`👤 ${u.firstName} ${u.lastName}\n🆔 ID: ${u.telegramId}\n🎂 Yosh: ${ageOf(u.dateOfBirth)}\n👑 Premium: ${premium(u)?'Faol':'Yo‘q'}`,menu());
 if(text==='⭐ Premium')return ctx.reply('👑 Premium tariflarini Mini App ichida tanlang.',menu());
 if(text==='🔥 Mashhur animelar'){const count=await Anime.countDocuments({status:'published',audienceCategory:{$ne:'adults'}});return ctx.reply(`🔥 Katalogda ${count} ta umumiy anime mavjud. Tomosha qilish uchun ilovani oching.`,menu())}
 if(text==='📞 Yordam')return ctx.reply('📞 Yordam uchun admin bilan bog‘laning.',menu());if(text==='❤️ Sevimlilar')return ctx.reply('❤️ Sevimli animelaringiz Mini App profilida.',menu());
 if(text.startsWith('/'))return next();
 return ctx.reply('🎌 Menyudan tanlang.',menu())});
 bot.action(/^prem:(approve|reject):([a-f\d]{24})$/,async ctx=>{if(!adminIds().has(String(ctx.from.id)))return ctx.answerCbQuery('Ruxsat yo‘q',{show_alert:true});try{const {handleRequest}=await import('./premium.js');const r=await handleRequest(ctx.match[2],ctx.match[1],String(ctx.from.id));await ctx.answerCbQuery(r.status==='approved'?'Premium faollashtirildi':'Rad etildi');await ctx.editMessageReplyMarkup(undefined).catch(()=>{});await ctx.reply(`So‘rov: ${r.status}`)}catch(e){await ctx.answerCbQuery(e.message.slice(0,160),{show_alert:true})}});
 await bot.launch();console.log('Telegram bot ishga tushdi');}
export async function sendAdmins(req,user,plan){if(!bot)return [];const ids=[...adminIds()],sent=[];for(const id of ids){try{await bot.telegram.sendMessage(id,`👑 YANGI PREMIUM SO‘ROVI\n\n👤 ${user.firstName} ${user.lastName}\n🆔 Telegram ID: ${user.telegramId}\n📱 @${user.username||'yoq'}\n💎 Tarif: ${plan.name}\n💰 Narx: ${plan.price?plan.price.toLocaleString('uz-UZ')+' so‘m':'Admin belgilaydi'}\n📌 Holat: To‘lov kutilmoqda`,{reply_markup:{inline_keyboard:[[{'text':'✅ Faollashtirish','callback_data':`prem:approve:${req._id}`},{'text':'❌ Rad etish','callback_data':`prem:reject:${req._id}`}]]}});sent.push(id)}catch(e){console.warn('Adminga xabar yuborilmadi:',id,e.message)}}return sent}
export async function notify(id,text){if(!bot)return;try{await bot.telegram.sendMessage(String(id),text)}catch(e){console.warn('Xabar yuborilmadi:',e.message)}}
export async function stopBot(){if(bot){try{bot.stop('shutdown')}catch{}}}
