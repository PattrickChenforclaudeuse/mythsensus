// api/line/webhook.js — LINE Messaging API Webhook
// Receives events from LINE OA (messages, follows, etc.)

export const config = { runtime: 'nodejs' };

import crypto from 'crypto';

function validateSignature(body, channelSecret, signature) {
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Mythsensus LINE Webhook active' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const CHANNEL_SECRET = process.env.LINE_MESSAGING_CHANNEL_SECRET;
  const ACCESS_TOKEN = process.env.LINE_MESSAGING_ACCESS_TOKEN;
  
  // Validate signature
  const signature = req.headers['x-line-signature'];
  const rawBody = JSON.stringify(req.body);
  
  if (CHANNEL_SECRET && !validateSignature(rawBody, CHANNEL_SECRET, signature)) {
    console.error('Invalid LINE signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { events } = req.body;
  
  if (!events || events.length === 0) {
    return res.status(200).json({ status: 'ok' });
  }
  
  for (const event of events) {
    try {
      await handleEvent(event, ACCESS_TOKEN);
    } catch (err) {
      console.error('Event handling error:', err, event);
    }
  }
  
  return res.status(200).json({ status: 'ok' });
}

async function handleEvent(event, accessToken) {
  const replyToken = event.replyToken;
  
  // Handle follow event — send welcome message
  if (event.type === 'follow') {
    await replyMessage(replyToken, accessToken, [
      {
        type: 'text',
        text: '✨ ยินดีต้อนรับสู่ Mythsensus\n\nคุณพร้อมค้นพบคะแนนจักรวาลของตัวเองแล้วหรือยัง?\n\n🔮 เริ่มต้นได้ที่: https://mythsensus.com'
      }
    ]);
    return;
  }
  
  // Handle text messages
  if (event.type === 'message' && event.message.type === 'text') {
    const text = event.message.text.toLowerCase().trim();
    
    if (text.includes('score') || text.includes('คะแนน') || text.includes('ดวง')) {
      await replyMessage(replyToken, accessToken, [
        {
          type: 'text',
          text: '🌟 ค้นหาคะแนนจักรวาลของคุณได้ที่:\nhttps://mythsensus.com\n\nระบบ 10 ศาสตร์โบราณรวมเป็นหนึ่งเดียว'
        }
      ]);
    } else if (text.includes('สวัสดี') || text.includes('hello') || text.includes('hi')) {
      await replyMessage(replyToken, accessToken, [
        {
          type: 'text',
          text: '✨ สวัสดีครับ! ผม Mythsensus Bot\n\nพิมพ์ "คะแนน" เพื่อดู Cosmic Score ของคุณ\nหรือเยี่ยมชม https://mythsensus.com'
        }
      ]);
    } else {
      await replyMessage(replyToken, accessToken, [
        {
          type: 'text',
          text: '🔮 ค้นพบโชคชะตาจักรวาลของคุณที่ Mythsensus\nhttps://mythsensus.com'
        }
      ]);
    }
    return;
  }
}

async function replyMessage(replyToken, accessToken, messages) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    },
    body: JSON.stringify({ replyToken, messages })
  });
}
