// Extract URLs from text and JSON
export function extractUrls(text, governedJson) {
  const urls = new Set();
  
  // Extract from plain text
  if (text) {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    const matches = text.match(urlRegex);
    if (matches) {
      matches.forEach(url => urls.add(url.trim()));
    }
  }
  
  // Extract from governedJson sources
  if (governedJson?.sources?.items) {
    governedJson.sources.items.forEach(item => {
      if (item.url) urls.add(item.url.trim());
    });
  }
  
  return Array.from(urls);
}

// Check if URL is a placeholder domain
export function isPlaceholderUrl(url) {
  const placeholderDomains = [
    "example.com",
    "example.org",
    "test.com",
    "placeholder.com",
    "yoursite.com",
    "domain.com",
    "website.com",
  ];
  
  try {
    const urlObj = new URL(url);
    return placeholderDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

// Verify citation integrity
export function verifyCitationIntegrity(parsedOutputText, governedJson, grounding) {
  const outputUrls = extractUrls(parsedOutputText, null);
  const sourceUrls = governedJson?.sources?.items?.map(s => s.url.trim()) || [];
  
  // Flag uncited links (URLs in output but not in sources)
  const uncitedLinks = outputUrls.filter(url => !sourceUrls.includes(url));
  
  // Flag unused sources (URLs in sources but not in output)
  const unusedSources = sourceUrls.filter(url => !outputUrls.includes(url));
  
  // Flag placeholder domains
  const placeholderLinks = [...outputUrls, ...sourceUrls].filter(isPlaceholderUrl);
  
  // Check for numbers/dates/entities without citations when grounding=on
  const hasSpecificClaims = grounding === "on" && parsedOutputText && 
    (/\d{4}|\d+%|\$\d+|\d+ (million|billion|thousand)/i.test(parsedOutputText));
  const hasNoCitations = sourceUrls.length === 0;
  
  return {
    uncitedLinks,
    unusedSources,
    placeholderLinks,
    uncitedClaimsWarning: hasSpecificClaims && hasNoCitations,
  };
}

// Compute hallucination risk level
export function computeHallucinationRisk(citationIntegrity, validation, evidence) {
  let riskScore = 0;
  
  // Citation issues
  if (citationIntegrity.uncitedLinks.length > 0) riskScore += citationIntegrity.uncitedLinks.length * 2;
  if (citationIntegrity.placeholderLinks.length > 0) riskScore += citationIntegrity.placeholderLinks.length * 3;
  if (citationIntegrity.uncitedClaimsWarning) riskScore += 2;
  
  // Validation issues
  if (evidence?.safe_mode_applied) riskScore += 5;
  if (evidence?.repairs > 1) riskScore += evidence.repairs;
  if (!validation?.passed) riskScore += 3;
  
  // Grounding issues
  if (evidence?.grounding === "on" && (!citationIntegrity || citationIntegrity.unusedSources.length === 0)) {
    riskScore += 1;
  }
  
  // Classify risk
  if (riskScore === 0) return "LOW";
  if (riskScore <= 5) return "MEDIUM";
  return "HIGH";
}

// Compute comprehensive hallucination telemetry
export function computeHallucinationTelemetry(record) {
  const citationIntegrity = verifyCitationIntegrity(
    record.parsedOutputText,
    record.governedJson,
    record.grounding
  );
  
  const risk = computeHallucinationRisk(
    citationIntegrity,
    record.validation,
    record.evidence
  );
  
  return {
    risk,
    citationIntegrity,
  };
}