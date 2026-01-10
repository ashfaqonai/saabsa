# Email Deliverability Fix Guide for Saabsa Solutions

## Problem: Emails going to Gmail Spam

Gmail is marking Saabsa Solutions emails as spam because of missing or incorrect email authentication records. This guide will help you fix this issue.

---

## 🔍 Step 1: Check Current DNS Records

First, verify what email authentication records you currently have:

### Tools to Check:
1. **MXToolbox**: https://mxtoolbox.com/spf.aspx
2. **DMARC Analyzer**: https://www.dmarcanalyzer.com/
3. **Google Admin Toolbox**: https://toolbox.googleapps.com/apps/checkmx/check

### What to Check:
- SPF record for `saabsa.com`
- DKIM record (depends on your email provider)
- DMARC record for `saabsa.com`

---

## ✅ Step 2: Set Up Email Authentication Records

### A. SPF (Sender Policy Framework) Record

**Purpose**: Tells receiving servers which servers are authorized to send email for your domain.

**Add this TXT record to your DNS:**

```
Type: TXT
Name: @ (or saabsa.com)
Value: v=spf1 include:_spf.google.com include:zoho.com ~all
TTL: 3600
```

**If using Zoho Mail only:**
```
v=spf1 include:zoho.com ~all
```

**If using Google Workspace only:**
```
v=spf1 include:_spf.google.com ~all
```

**If using both:**
```
v=spf1 include:_spf.google.com include:zoho.com ~all
```

**Explanation:**
- `v=spf1` = SPF version 1
- `include:zoho.com` = Authorizes Zoho's mail servers
- `include:_spf.google.com` = Authorizes Google's mail servers (if using Google Workspace)
- `~all` = Soft fail for other servers (use `-all` for hard fail after testing)

---

### B. DKIM (DomainKeys Identified Mail) Record

**Purpose**: Cryptographically signs your emails to prove they're authentic.

**For Zoho Mail:**
1. Log into Zoho Mail Admin Console
2. Go to **Domain Settings** → **Email Authentication**
3. Enable **DKIM**
4. Copy the DKIM public key provided
5. Add it as a TXT record in your DNS:

```
Type: TXT
Name: zmail._domainkey (or whatever Zoho provides)
Value: [The DKIM key provided by Zoho]
TTL: 3600
```

**For Google Workspace:**
1. Go to Google Admin Console
2. Navigate to **Apps** → **Google Workspace** → **Gmail**
3. Click **Authenticate email**
4. Copy the DKIM key
5. Add it as a TXT record in your DNS

**Example DKIM record format:**
```
Type: TXT
Name: zmail._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

---

### C. DMARC (Domain-based Message Authentication) Record

**Purpose**: Tells receiving servers what to do with emails that fail SPF/DKIM checks.

**Add this TXT record to your DNS:**

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@saabsa.com; ruf=mailto:dmarc@saabsa.com; fo=1
TTL: 3600
```

**Start with `p=none` (monitoring mode)**, then after 1-2 weeks, change to:

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@saabsa.com; ruf=mailto:dmarc@saabsa.com; pct=100
```

**After confirming everything works, use:**

```
v=DMARC1; p=reject; rua=mailto:dmarc@saabsa.com; ruf=mailto:dmarc@saabsa.com; sp=reject; aspf=r
```

**Explanation:**
- `v=DMARC1` = DMARC version 1
- `p=none` = Don't reject/quarantine (monitoring only)
- `p=quarantine` = Send failed emails to spam
- `p=reject` = Reject failed emails completely
- `rua=mailto:dmarc@saabsa.com` = Where to send aggregate reports
- `ruf=mailto:dmarc@saabsa.com` = Where to send forensic reports
- `fo=1` = Generate reports for all failures

---

## 📋 Step 3: Complete DNS Records Checklist

Add these records to your DNS provider (wherever you manage saabsa.com DNS):

### Required Records:

1. **SPF Record:**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:zoho.com ~all
   ```

2. **DKIM Record:**
   ```
   Type: TXT
   Name: zmail._domainkey (or as provided by Zoho)
   Value: [From Zoho Mail Admin Console]
   ```

3. **DMARC Record:**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@saabsa.com
   ```

4. **MX Records (if not already set):**
   ```
   Type: MX
   Priority: 10
   Value: mx.zoho.com
   ```

---

## 🔧 Step 4: Verify DNS Records

After adding records, wait 5-15 minutes for DNS propagation, then verify:

### Verification Tools:
1. **MXToolbox SPF Check**: https://mxtoolbox.com/spf.aspx
   - Enter: `saabsa.com`
   - Should show: ✅ Valid SPF record

2. **MXToolbox DMARC Check**: https://mxtoolbox.com/dmarc.aspx
   - Enter: `saabsa.com`
   - Should show: ✅ Valid DMARC record

3. **DKIM Check**: https://mxtoolbox.com/dkim.aspx
   - Enter: `saabsa.com`
   - Should show: ✅ Valid DKIM record

4. **Google Admin Toolbox**: https://toolbox.googleapps.com/apps/checkmx/check
   - Enter: `saabsa.com`
   - Should show all green checkmarks

---

## 📧 Step 5: Test Email Deliverability

### A. Send Test Emails:
1. Send an email from `sales@saabsa.com` to a Gmail address
2. Check the email headers in Gmail:
   - Open the email
   - Click the three dots (⋮) → "Show original"
   - Look for:
     - ✅ `SPF: PASS`
     - ✅ `DKIM: PASS`
     - ✅ `DMARC: PASS`

### B. Use Email Testing Tools:
1. **Mail-Tester**: https://www.mail-tester.com/
   - Send email to the address they provide
   - Aim for 10/10 score

2. **GlockApps**: https://glockapps.com/
   - Free trial available
   - Tests deliverability across multiple providers

---

## 🚨 Step 6: Additional Best Practices

### Email Content:
- ✅ Avoid spam trigger words: "Free", "Act Now", "Limited Time", excessive exclamation marks
- ✅ Include plain text version (not just HTML)
- ✅ Don't use URL shorteners
- ✅ Include unsubscribe link (if sending marketing emails)
- ✅ Keep image-to-text ratio balanced

### Sender Reputation:
- ✅ Warm up new email addresses gradually
- ✅ Maintain consistent sending volume
- ✅ Monitor bounce rates (keep under 2%)
- ✅ Monitor spam complaint rates (keep under 0.1%)
- ✅ Use a professional email signature

### Technical:
- ✅ Use a dedicated IP (if sending high volume)
- ✅ Set up reverse DNS (PTR record) for your mail server
- ✅ Ensure your mail server isn't on blacklists
- ✅ Use TLS/SSL for email transmission

---

## 🔄 Step 7: Monitor and Maintain

### Weekly Checks:
1. Review DMARC reports (sent to `dmarc@saabsa.com`)
2. Check bounce rates
3. Monitor spam complaint rates

### Monthly Checks:
1. Verify DNS records are still valid
2. Check blacklist status: https://mxtoolbox.com/blacklists.aspx
3. Review email engagement metrics

---

## 🆘 Troubleshooting

### Emails Still Going to Spam?

1. **Check DNS Propagation:**
   - Use: https://www.whatsmydns.net/
   - Enter your domain and check TXT records globally

2. **Verify Records Are Correct:**
   - Double-check for typos in DNS records
   - Ensure no extra spaces or quotes

3. **Wait for Propagation:**
   - DNS changes can take up to 48 hours
   - Usually takes 5-15 minutes

4. **Check Blacklists:**
   - https://mxtoolbox.com/blacklists.aspx
   - If listed, request removal

5. **Review Email Content:**
   - Test with Mail-Tester
   - Fix any content issues

6. **Contact Your Email Provider:**
   - Zoho Support: https://help.zoho.com/
   - Google Workspace Support: https://support.google.com/a

---

## 📞 Quick Reference

### Your Email Addresses:
- `sales@saabsa.com` (Primary for inquiries)
- `info@saabsa.com` (General information)
- `contact@saabsa.com` (General contact)
- `dmarc@saabsa.com` (For DMARC reports)

### DNS Provider:
[Add your DNS provider here - e.g., Cloudflare, GoDaddy, Namecheap]

### Email Provider:
[Add your email provider here - e.g., Zoho Mail, Google Workspace]

---

## ✅ Success Checklist

- [ ] SPF record added and verified
- [ ] DKIM record added and verified
- [ ] DMARC record added and verified
- [ ] MX records configured correctly
- [ ] Test email sent and verified (SPF/DKIM/DMARC all PASS)
- [ ] Mail-Tester score is 8/10 or higher
- [ ] Gmail test shows emails in inbox (not spam)
- [ ] DMARC reports are being received
- [ ] Email signature is professional
- [ ] Email content follows best practices

---

## 📚 Additional Resources

- **Google Postmaster Tools**: https://postmaster.google.com/
  - Monitor your domain's reputation with Google
  - Requires verification

- **Microsoft SNDS**: https://sendersupport.olc.protection.outlook.com/snds/
  - Monitor reputation with Outlook/Hotmail

- **DMARC Guide**: https://dmarc.org/wiki/FAQ

- **SPF Record Syntax**: https://www.openspf.org/SPF_Record_Syntax

---

**Last Updated**: January 2025
**Status**: Ready for implementation

