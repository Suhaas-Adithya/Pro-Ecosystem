/**
 * Pro Mail Security Engine
 * Performs heuristic analysis for Phishing, Spam, and Categorization.
 */

const SPAM_KEYWORDS = ['free', 'win', 'prize', 'prize', 'winner', 'claim', 'urgent', 'limited time', 'offer', 'exclusive'];
const PHISHING_KEYWORDS = ['password reset', 'account locked', 'verify your account', 'security alert', 'login attempt'];
const NEWSLETTER_KEYWORDS = ['unsubscribe', 'update preferences', 'view in browser', 'mailing list'];
const SOCIAL_KEYWORDS = ['followed you', 'tagged you', 'commented', 'friend request', 'facebook', 'twitter', 'linkedin', 'instagram', 'discord'];
const PROMO_KEYWORDS = ['discount', 'sale', 'save', 'shop', 'deal', 'limited time', 'coupon', 'off'];
const SECURITY_KEYWORDS = ['verification code', '2fa', 'otp', 'confirm your email', 'security code', 'access code'];

export function analyzeEmail(email) {
  const subject = email.subject?.toLowerCase() || '';
  const body = email.body?.toLowerCase() || '';
  const sender = email.senderEmail?.toLowerCase() || '';

  let score = 0;
  let reasons = [];
  let category = 'primary';

  // 1. Phishing Detection
  const phishingMatches = PHISHING_KEYWORDS.filter(kw => subject.includes(kw) || body.includes(kw));
  if (phishingMatches.length > 0) {
    score += 50;
    reasons.push('Suspicious security-related language detected.');
  }

  // Check for mismatched links (Phishing hallmark)
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  let match;
  while ((match = linkRegex.exec(body)) !== null) {
    const url = new URL(match[1]);
    const senderDomain = sender.split('@')[1];
    if (senderDomain && !url.hostname.includes(senderDomain) && !['google.com', 'microsoft.com', 'apple.com'].some(d => url.hostname.includes(d))) {
      score += 30;
      reasons.push(`Contains links to external domain: ${url.hostname}`);
    }
  }

  // 2. Spam Detection
  const spamMatches = SPAM_KEYWORDS.filter(kw => subject.includes(kw));
  if (spamMatches.length > 0) {
    score += 40;
    reasons.push('Contains promotional or urgent spam keywords in subject.');
  }

  // 3. Categorization
  if (SECURITY_KEYWORDS.some(kw => subject.includes(kw) || body.includes(kw))) {
    category = 'security';
  } else if (SOCIAL_KEYWORDS.some(kw => subject.includes(kw) || body.includes(kw) || sender.includes('social'))) {
    category = 'social';
  } else if (PROMO_KEYWORDS.some(kw => subject.includes(kw) || body.includes(kw)) || sender.includes('promo')) {
    category = 'promotions';
  } else if (NEWSLETTER_KEYWORDS.some(kw => body.includes(kw)) || sender.includes('newsletter') || sender.includes('info@')) {
    category = 'newsletters';
  }

  return {
    isSpam: score >= 40,
    isPhishing: score >= 70,
    securityScore: score,
    securityReasons: reasons,
    category,
    unsubscribeLink: extractUnsubscribeLink(email.body)
  };
}

function extractUnsubscribeLink(body) {
  if (!body) return null;
  const match = body.match(/href=["']([^"']*(?:unsubscribe|opt-out|preferences)[^"']*)["']/i);
  return match ? match[1] : null;
}
