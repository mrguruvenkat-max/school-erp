const { prisma } = require('../database/db');

/**
 * Sends SMS through configured SMS provider
 * @param {string} mobileNumber 10-digit Indian phone number
 * @param {string} message SMS body content
 */
async function sendConfigurableSMS(mobileNumber, message) {
  try {
    // 1. Get system settings from DB
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = { smsProvider: 'MOCK' };
    }

    const provider = (settings.smsProvider || 'MOCK').toUpperCase();
    console.log(`\n📲 [SMS ROUTER] Sending SMS to ${mobileNumber} via ${provider}...`);
    console.log(`📲 [SMS ROUTER] Message: "${message}"`);

    if (provider === 'FAST2SMS') {
      const apiKey = settings.fast2smsApiKey;
      if (!apiKey) {
        throw new Error("Fast2SMS API key is not configured in settings.");
      }

      // Fast2SMS Quick SMS API path
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${mobileNumber}`;
      
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (res.ok && data.return) {
        console.log("📲 [SMS SUCCESS] Fast2SMS delivered successfully! Details:", data.message);
        return { success: true, provider: 'FAST2SMS' };
      } else {
        throw new Error(data.message || "Fast2SMS returned error state.");
      }

    } else if (provider === 'TWILIO') {
      const { twilioSid, twilioToken, twilioFrom } = settings;
      if (!twilioSid || !twilioToken || !twilioFrom) {
        throw new Error("Twilio SID, Token, or From Number missing from settings.");
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      
      const params = new URLSearchParams();
      params.append('From', twilioFrom);
      params.append('To', `+91${mobileNumber}`);
      params.append('Body', message);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const data = await res.json();
      if (res.ok) {
        console.log("📲 [SMS SUCCESS] Twilio delivered successfully! SID:", data.sid);
        return { success: true, provider: 'TWILIO' };
      } else {
        throw new Error(data.message || "Twilio returned failure response.");
      }

    } else {
      // Fallback: MOCK provider
      // Print in console
      console.log(`📲 [SMS MOCK] Simulated SMS sent to ${mobileNumber}: "${message}"`);

      // Best-effort free Textbelt call
      try {
        const textbeltRes = await fetch('https://textbelt.com/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            number: '+91' + mobileNumber,
            message: message,
            key: 'textbelt'
          })
        });
        const textbeltData = await textbeltRes.json();
        if (textbeltData.success) {
          console.log("📲 [SMS SUCCESS] Textbelt fallback delivery succeeded!");
        } else {
          console.warn("📲 [SMS WARNING] Textbelt fallback delivery skipped/failed:", textbeltData.error);
        }
      } catch (err) {
        console.error("📲 [SMS ERROR] Textbelt gateway network failure:", err.message);
      }

      return { success: true, provider: 'MOCK' };
    }

  } catch (err) {
    console.error("❌ [SMS ROUTER ERROR] Failed to dispatch SMS:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendConfigurableSMS };
