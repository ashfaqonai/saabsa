# DNS Records Fix for Saabsa Solutions

## 🔍 Current Issues Found

### Issue 1: SPF Record (@) - Has Problems
**Current:**
```
v=spf1 include:dc-8e814c8572._spfm.saabsa.com include:dc-8e814c8572._spfm.saabsa.com ~all
```

**Problems:**
- ❌ Duplicate include (same domain listed twice)
- ❌ Using subdomain reference instead of direct Zoho include
- ❌ Overly complex structure

### Issue 2: SPF Record (dc-8e814c8572._spfm) - Redundant
**Current:**
```
v=spf1 include:dc-8e814c8572._spfm.saabsa.com include:zohomail.com ~all
```

**Problems:**
- ❌ Self-referencing (circular reference)
- ❌ Using `zohomail.com` (should verify if this is correct for Zoho)
- ❌ This subdomain record may not be needed

### Issue 3: DMARC Record - Incomplete
**Current:**
```
v=DMARC1; p=none; rua=mailto:dmarc@saabsa.com
```

**Problems:**
- ⚠️ Missing `ruf` parameter (forensic reports)
- ⚠️ Missing `fo` parameter (failure options)

### Issue 4: DKIM Record - Missing
- ❌ No DKIM record found
- ❌ This is critical for email authentication

---

## ✅ CORRECTED DNS RECORDS

### 1. SPF Record (Main - @ or saabsa.com)

**DELETE the current @ SPF record and REPLACE with:**

```
Type: TXT
Name: @ (or saabsa.com)
Value: v=spf1 include:zoho.com ~all
TTL: 1 Hour (3600 seconds)
```

**If you're using Zoho Mail with custom domain setup, you might need:**
```
v=spf1 include:zohomail.com ~all
```

**Note:** Check with Zoho which include is correct. Most Zoho setups use `zoho.com`, but some use `zohomail.com`.

---

### 2. SPF Record (dc-8e814c8572._spfm) - DELETE THIS

**Action:** DELETE this record entirely. It's redundant and causing circular references.

**Reason:** The main SPF record (@) should handle all email authentication. The subdomain record is unnecessary and can cause issues.

---

### 3. DMARC Record - UPDATE

**UPDATE the current _dmarc record to:**

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@saabsa.com; ruf=mailto:dmarc@saabsa.com; fo=1
TTL: 1 Hour (3600 seconds)
```

**Explanation:**
- `p=none` = Monitoring mode (don't reject/quarantine yet)
- `rua=mailto:dmarc@saabsa.com` = Aggregate reports email
- `ruf=mailto:dmarc@saabsa.com` = Forensic reports email
- `fo=1` = Generate reports for all failures

---

### 4. DKIM Record - ADD THIS (CRITICAL)

**You need to get this from Zoho Mail:**

1. Log into **Zoho Mail Admin Console**
2. Go to **Domain Settings** → **Email Authentication** → **DKIM**
3. Enable DKIM if not already enabled
4. Copy the DKIM public key provided
5. Add as TXT record:

```
Type: TXT
Name: zmail._domainkey (or whatever Zoho provides - could be different)
Value: [The complete DKIM key from Zoho - starts with v=DKIM1; k=rsa; p=...]
TTL: 1 Hour (3600 seconds)
```

**Example format (your actual key will be different):**
```
v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

---

## 📋 ACTION CHECKLIST

### Step 1: Verify Zoho Configuration
- [ ] Log into Zoho Mail Admin Console
- [ ] Check which SPF include is correct: `zoho.com` or `zohomail.com`
- [ ] Get your DKIM key from Zoho

### Step 2: Update DNS Records
- [ ] **DELETE** the `dc-8e814c8572._spfm` SPF record
- [ ] **UPDATE** the `@` SPF record to: `v=spf1 include:zoho.com ~all` (or zohomail.com if that's what Zoho uses)
- [ ] **UPDATE** the `_dmarc` record to include `ruf` and `fo` parameters
- [ ] **ADD** the DKIM record from Zoho

### Step 3: Wait for Propagation
- [ ] Wait 5-15 minutes for DNS propagation
- [ ] Verify records are live

### Step 4: Verify Records
- [ ] Check SPF: https://mxtoolbox.com/spf.aspx?saabsa.com
- [ ] Check DMARC: https://mxtoolbox.com/dmarc.aspx?saabsa.com
- [ ] Check DKIM: https://mxtoolbox.com/dkim.aspx?saabsa.com
- [ ] All should show ✅ Valid

### Step 5: Test Email
- [ ] Send test email from `sales@saabsa.com` to Gmail
- [ ] Check email headers (Show original in Gmail)
- [ ] Verify: SPF: PASS, DKIM: PASS, DMARC: PASS

---

## 🎯 FINAL DNS RECORDS SUMMARY

After fixes, you should have exactly these records:

### 1. SPF (Main)
```
Type: TXT
Name: @
Value: v=spf1 include:zoho.com ~all
```

### 2. DMARC
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@saabsa.com; ruf=mailto:dmarc@saabsa.com; fo=1
```

### 3. DKIM
```
Type: TXT
Name: zmail._domainkey (or as provided by Zoho)
Value: [From Zoho Mail Admin Console]
```

### 4. MX Records (if not already set)
```
Type: MX
Priority: 10
Value: mx.zoho.com
```

---

## ⚠️ IMPORTANT NOTES

1. **Zoho SPF Include**: Verify with Zoho whether to use:
   - `include:zoho.com` (most common)
   - `include:zohomail.com` (some Zoho setups)
   
   Check your Zoho Mail Admin Console → Domain Settings → Email Authentication → SPF

2. **DKIM is Critical**: Without DKIM, emails will likely still go to spam even with SPF and DMARC.

3. **Start with `p=none`**: Keep DMARC in monitoring mode for 1-2 weeks, then change to `p=quarantine`, then finally `p=reject`.

4. **Delete Redundant Records**: The `dc-8e814c8572._spfm` record should be deleted as it's causing issues.

---

## 🆘 If Still Having Issues

1. **Verify Zoho Configuration:**
   - Contact Zoho support to confirm correct SPF include
   - Ensure DKIM is properly configured in Zoho

2. **Check DNS Propagation:**
   - Use: https://www.whatsmydns.net/
   - Enter `saabsa.com` and check TXT records globally

3. **Test with Mail-Tester:**
   - https://www.mail-tester.com/
   - Send email to their test address
   - Aim for 8/10 or higher

4. **Check Blacklists:**
   - https://mxtoolbox.com/blacklists.aspx
   - Enter your domain or IP

---

**Last Updated**: January 2025
**Status**: Ready to implement

