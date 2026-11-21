import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import {User} from './models.js';
export const adminIds=()=>new Set((process.env.ADMIN_IDS||'').split(',').map(s=>s.trim()).filter(Boolean));
export const isAdmin=u=>!!u&&adminIds().has(String(u.telegramId));
export function verifyTelegram(initData,token,maxAge=86400){
 if(!initData||typeof initData!=='string'||initData.length>8192)throw Error('Telegram initData kerak');
 const q=new URLSearchParams(initData),hash=q.get('hash');if(!hash||!/^[a-f\d]{64}$/i.test(hash))throw Error('Telegram imzosi noto‘g‘ri');
 const data=[...q.entries()].filter(([k])=>k!=='hash').sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
 const secret=crypto.createHmac('sha256','WebAppData').update(token).digest();
 const check=crypto.createHmac('sha256',secret).update(data).digest();
 if(!crypto.timingSafeEqual(check,Buffer.from(hash,'hex')))throw Error('Telegram imzosi mos emas');
 const time=Number(q.get('auth_date'));if(!Number.isFinite(time)||Math.abs(Date.now()/1000-time)>maxAge)throw Error('Telegram sessiyasi eskirgan');
 const user=JSON.parse(q.get('user')||'null');if(!user?.id)throw Error('Telegram foydalanuvchisi yo‘q');return user;
}
export const tokenFor=u=>jwt.sign({uid:String(u._id),tid:String(u.telegramId)},process.env.JWT_SECRET,{expiresIn:'12h'});
export async function auth(req,res,next){try{const bearer=req.headers.authorization||'';if(!bearer.startsWith('Bearer '))return res.status(401).json({error:'Avtorizatsiya kerak'});const payload=jwt.verify(bearer.slice(7),process.env.JWT_SECRET);const user=await User.findById(payload.uid);if(!user||user.isBanned||String(user.telegramId)!==payload.tid)return res.status(401).json({error:'Kirish taqiqlangan'});req.user=user;next()}catch{return res.status(401).json({error:'Sessiya yaroqsiz'})}}
export const admin=(req,res,next)=>isAdmin(req.user)?next():res.status(403).json({error:'Faqat admin uchun'});
export function ageOf(d){if(!d)return 0;const born=new Date(d),now=new Date();if(Number.isNaN(born.getTime()))return 0;let n=now.getUTCFullYear()-born.getUTCFullYear();if(now.getUTCMonth()<born.getUTCMonth()||(now.getUTCMonth()===born.getUTCMonth()&&now.getUTCDate()<born.getUTCDate()))n--;return n}
export const canSee=(anime,user)=>anime.status==='published'&&(anime.audienceCategory!=='adults'||ageOf(user?.dateOfBirth)>=18)&&ageOf(user?.dateOfBirth)>=Number(anime.minimumAge||0);
export const premium=u=>!!u?.premiumUntil&&new Date(u.premiumUntil)>new Date();
export function extendDate(start,plan){const d=new Date(start);if(plan.months){const original=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+plan.months);const end=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(original,end))}else d.setUTCDate(d.getUTCDate()+(plan.days||7));return d}
export function slug(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||`anime-${Date.now()}`}
export function safeUrl(s){try{const u=new URL(s);return (u.protocol==='https:'||u.protocol==='http:')&&!['localhost','127.0.0.1','0.0.0.0','::1'].includes(u.hostname)&&!u.hostname.endsWith('.local')&&!u.hostname.startsWith('10.')&&!u.hostname.startsWith('192.168.')&&!/^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname)}catch{return false}}
