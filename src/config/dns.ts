import dns from 'node:dns';

// On Windows, IPv6 is sometimes preferred for DNS resolution but TLS handshakes
// to Google services (Firebase Admin SDK) can fail silently with "internal_failure".
// Forcing IPv4 here only affects Windows environments. Linux/Mac/cloud are unaffected.
if (process.platform === 'win32') {
  dns.setDefaultResultOrder('ipv4first');
}