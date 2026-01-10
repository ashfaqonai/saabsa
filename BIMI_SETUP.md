# BIMI (Brand Indicators for Message Identification) Setup for Saabsa Solutions

## ✅ What's Been Created

1. **BIMI Logo**: `bimi-logo.svg` - A BIMI-compliant SVG logo based on your favicon
2. **Configuration Guide**: This document with all DNS records needed

---

## 📋 Prerequisites (MUST BE COMPLETED FIRST)

BIMI requires:
- ✅ **DMARC policy**: Must be `p=quarantine` or `p=reject` (NOT `p=none`)
- ✅ **DMARC policy percentage**: Must be 100% (`pct=100`)
- ✅ **SPF**: Must be configured and passing
- ✅ **DKIM**: Must be configured and passing

**⚠️ IMPORTANT**: Your current DMARC is `p=none`. You MUST update it to `p=quarantine` or `p=reject` before BIMI will work.

---

## 🚀 Step-by-Step Setup

### Step 1: Upload BIMI Logo to Your Website

1. Upload `bimi-logo.svg` to your website root directory
2. Ensure it's accessible via HTTPS: `https://www.saabsa.com/bimi-logo.svg`
3. Test the URL in a browser to confirm it loads

**File Location**: 
- Upload to: `/bimi-logo.svg` (root of your GitHub Pages site)
- Full URL: `https://www.saabsa.com/bimi-logo.svg`

---

### Step 2: Update DMARC Record (REQUIRED)

**Current DMARC:**
```
v=DMARC1; p=none; rua=mailto:dmarc@saabsa.com
```

**Update to (for BIMI):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@saabsa.com; ruf=mailto:dmarc@saabsa.com; pct=100; fo=1
TTL: 1 Hour
```

**Explanation:**
- `p=quarantine` = Send failed emails to spam (required for BIMI)
- `pct=100` = Apply policy to 100% of emails (required for BIMI)
- `ruf=mailto:dmarc@saabsa.com` = Forensic reports email
- `fo=1` = Generate reports for all failures

**⚠️ Start with `p=quarantine`** - After 1-2 weeks of monitoring, you can change to `p=reject` if everything is working.

---

### Step 3: Add BIMI DNS Record

Add this TXT record to your DNS:

```
Type: TXT
Name: default._bimi
Value: v=BIMI1; l=https://www.saabsa.com/bimi-logo.svg;
TTL: 1 Hour (3600 seconds)
```

**Without VMC (Simpler - Works for Yahoo, some providers):**
```
v=BIMI1; l=https://www.saabsa.com/bimi-logo.svg;
```

**With VMC (Required for Gmail - Optional for now):**
```
v=BIMI1; l=https://www.saabsa.com/bimi-logo.svg; a=https://www.saabsa.com/vmc.pem;
```

**Note**: Gmail requires a VMC (Verified Mark Certificate) to display logos. This is optional and can be added later. Yahoo and other providers will show the logo without VMC.

---

### Step 4: Verify BIMI Setup

#### A. Verify DNS Record:
1. **MXToolbox**: https://mxtoolbox.com/txtlookup.aspx
   - Enter: `default._bimi.saabsa.com`
   - Should show your BIMI record

2. **DNS Checker**: https://www.whatsmydns.net/
   - Enter: `default._bimi.saabsa.com`
   - Check TXT records globally

#### B. Verify Logo Accessibility:
1. Open: `https://www.saabsa.com/bimi-logo.svg`
2. Should display the hex icon logo
3. Must be accessible via HTTPS

#### C. Test Email:
1. Send email from `sales@saabsa.com` to:
   - **Yahoo Mail** (supports BIMI without VMC)
   - **Gmail** (requires VMC for logo display)
2. Check if logo appears next to email

#### D. Use BIMI Validator:
- **BIMI Inspector**: https://bimigroup.org/bimi-inspector/
- Enter your domain: `saabsa.com`
- Should show BIMI status

---

## 📊 BIMI Support by Email Provider

| Provider | Logo Display | VMC Required |
|----------|--------------|--------------|
| **Yahoo Mail** | ✅ Yes | ❌ No |
| **Gmail** | ✅ Yes | ✅ Yes (VMC required) |
| **Apple Mail** | ✅ Yes | ⚠️ Optional |
| **Outlook.com** | ⚠️ Limited | ❌ No |
| **FastMail** | ✅ Yes | ❌ No |

**Note**: Gmail requires a VMC (Verified Mark Certificate) from a certificate authority to display logos. This is a paid service and optional.

---

## 🔐 VMC (Verified Mark Certificate) - Optional for Gmail

If you want your logo to show in Gmail, you need a VMC:

**⚠️ IMPORTANT**: VMC certificates **CANNOT be generated locally**. They must be:
- ✅ Purchased from a Certificate Authority (CA)
- ✅ Issued after brand/trademark verification
- ✅ Cost: $200-500/year

**See detailed guide**: `VMC_CERTIFICATE_GUIDE.md` for complete instructions.

### VMC Providers:
1. **DigiCert**: https://www.digicert.com/brand-indicators-for-message-identification-bimi
2. **Entrust**: https://www.entrust.com/digital-security/certificate-solutions/bimi
3. **Sectigo**: https://sectigo.com/ssl-certificates-tls/bimi
4. **GlobalSign**: https://www.globalsign.com/en/bimi

### Quick Process:
1. **Purchase VMC** from a CA (requires trademark for VMC, or proof of usage for CMC)
2. **Receive certificate** (`.pem` file) after 1-5 business days
3. **Upload to website**: `https://www.saabsa.com/vmc.pem`
4. **Update BIMI record** to include VMC:
   ```
   v=BIMI1; l=https://www.saabsa.com/bimi-logo.svg; a=https://www.saabsa.com/vmc.pem;
   ```

**Cost**: VMC certificates typically cost $200-500/year.
**Note**: You can use BIMI without VMC - logo will show in Yahoo, Apple Mail, etc. Gmail requires VMC.

---

## ✅ Complete DNS Records Summary

After setup, you should have these records:

### 1. SPF
```
Type: TXT
Name: @
Value: v=spf1 include:zoho.com ~all
```

### 2. DKIM
```
Type: TXT
Name: zmail._domainkey (or as provided by Zoho)
Value: [From Zoho Mail Admin Console]
```

### 3. DMARC (Updated for BIMI)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@saabsa.com; ruf=mailto:dmarc@saabsa.com; pct=100; fo=1
```

### 4. BIMI (New)
```
Type: TXT
Name: default._bimi
Value: v=BIMI1; l=https://www.saabsa.com/bimi-logo.svg;
```

---

## 🎯 Action Checklist

### Immediate Actions:
- [ ] Upload `bimi-logo.svg` to website root
- [ ] Verify logo is accessible: `https://www.saabsa.com/bimi-logo.svg`
- [ ] Update DMARC to `p=quarantine; pct=100`
- [ ] Add BIMI DNS record (`default._bimi`)
- [ ] Wait 5-15 minutes for DNS propagation

### Verification:
- [ ] Verify BIMI DNS record with MXToolbox
- [ ] Verify logo URL loads correctly
- [ ] Send test email to Yahoo Mail
- [ ] Check if logo appears (may take 24-48 hours)

### Optional (For Gmail):
- [ ] Obtain VMC certificate
- [ ] Upload VMC file to website
- [ ] Update BIMI record to include VMC URL

---

## 🆘 Troubleshooting

### Logo Not Showing:
1. **Check DMARC**: Must be `p=quarantine` or `p=reject` with `pct=100`
2. **Check Logo URL**: Must be accessible via HTTPS
3. **Check DNS**: Verify BIMI record is correct
4. **Wait**: Can take 24-48 hours for logo to appear
5. **Email Provider**: Not all providers support BIMI

### BIMI Validation Fails:
1. **Logo Format**: Must be SVG, square (1:1), max 32KB
2. **HTTPS**: Logo must be served over HTTPS
3. **Accessibility**: Logo must be publicly accessible
4. **DMARC**: Must pass DMARC authentication

### Gmail Not Showing Logo:
- Gmail requires VMC (Verified Mark Certificate)
- This is a paid service ($200-500/year)
- Without VMC, Gmail won't display the logo
- Other providers (Yahoo, etc.) will show logo without VMC

---

## 📚 Additional Resources

- **BIMI Group**: https://bimigroup.org/
- **BIMI Inspector**: https://bimigroup.org/bimi-inspector/
- **BIMI Specification**: https://bimigroup.org/bimi-specification/
- **VMC Providers**: https://bimigroup.org/vmc-providers/

---

## ⚠️ Important Notes

1. **DMARC Policy**: Changing from `p=none` to `p=quarantine` means emails that fail authentication will go to spam. Make sure SPF and DKIM are working correctly first!

2. **Start with Monitoring**: Consider keeping `p=none` for 1-2 weeks to monitor, then switch to `p=quarantine` for BIMI.

3. **VMC is Optional**: You can use BIMI without VMC for Yahoo and other providers. Gmail requires VMC.

4. **Logo Requirements**:
   - SVG format
   - Square (1:1 aspect ratio)
   - Maximum 32KB file size
   - Must be HTTPS accessible
   - Simple and recognizable at small sizes

---

**Last Updated**: January 2025
**Status**: Ready to implement

