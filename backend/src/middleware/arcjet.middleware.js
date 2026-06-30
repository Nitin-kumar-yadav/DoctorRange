import aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProtection = async (req, res, next) => {
  try {
    const decision = await aj.protect(req)
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit({ window: '1m', max: 20 })) {
        return res.status(429).json({ message: 'Rate limit exceeded. Please try again later.' })
      }
      else if (decision.reason.isBot({ window: '1m', max: 20 })) {
        return res.status(403).json({ message: 'Bot access denied.' })
      }
      else if (decision.reason.isProxy({ window: '1m', max: 20 })) {
        return res.status(403).json({ message: 'Proxy access denied.' })
      }
      else {
        return res.status(403).json({ message: 'Access denied by security policy.' })
      }
    }

    if (decision.results.some(isSpoofedBot)) {
      return res.status(403).json({
        error: 'Spoofed bot detected',
        message: 'Malicious bot activity detected'
      })
    }
    next()

  } catch (error) {
    console.log('Arcjet Protection Error', error)
    next();
  }
}