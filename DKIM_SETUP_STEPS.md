# DKIM Setup Steps for Saabsa Solutions

## Current Status
- ❌ DKIM is not enabled
- ❌ No DKIM selector/record exists
- ⚠️ Error: "DKIM cannot be enabled for the domain as no verified default selector present"

---

## ✅ Step-by-Step: Add DKIM Selector

### Step 1: Click "+ Add" Button
1. On the DKIM page you're viewing, click the **"+ Add"** button
2. This will open a dialog to create a new DKIM selector

### Step 2: Create DKIM Selector
1. Zoho will generate a DKIM selector (usually something like `zmail` or `default`)
2. Zoho will provide you with:
   - **TXT Name/Host**: Something like `zmail._domainkey` or `default._domainkey`
   - **TXT Value**: A long string starting with `v=DKIM1; k=rsa; p=...`

### Step 3: Copy the DKIM Information
You'll need to copy:
- The **TXT Name/Host** (e.g., `zmail._domainkey`)
- The **TXT Value** (the complete DKIM key)

### Step 4: Add DKIM Record to Your DNS
1. Go to your DNS provider (where you manage saabsa.com DNS)
2. Add a new TXT record:
   ```
   Type: TXT
   Name: zmail._domainkey (or whatever Zoho provided)
   Value: [The complete TXT value from Zoho - starts with v=DKIM1; k=rsa; p=...]
   TTL: 1 Hour (3600 seconds)
   ```

### Step 5: Wait for DNS Propagation
- Wait 5-15 minutes for DNS to propagate
- Zoho will automatically verify the record

### Step 6: Verify in Zoho
1. Go back to the DKIM page in Zoho
2. The status should change from "No data available" to showing your record
3. The Status column should show "Verified" (green checkmark)
4. Once verified, you can enable the DKIM toggle

### Step 7: Enable DKIM
1. Once the record shows as "Verified"
2. Toggle the "Status" switch to **ON** (it will turn blue/green)
3. DKIM is now active!

---

## 📋 What You'll See After Setup

### In Zoho:
- ✅ DKIM selector listed in the table
- ✅ Status: "Verified" (green checkmark)
- ✅ Toggle: Enabled (ON)

### In Your DNS:
- ✅ TXT record: `zmail._domainkey` (or similar)
- ✅ Value: `v=DKIM1; k=rsa; p=[long key]...`

---

## 🔍 Verification After Setup

### Test DKIM:
1. **MXToolbox**: https://mxtoolbox.com/dkim.aspx
   - Enter: `saabsa.com`
   - Should show: ✅ Valid DKIM record

2. **Send Test Email**:
   - Send email from `sales@saabsa.com` to Gmail
   - In Gmail: Open email → Three dots → "Show original"
   - Look for: `DKIM: PASS`

---

## ⚠️ Important Notes

1. **DNS Propagation**: Can take 5-15 minutes, sometimes up to 48 hours
2. **Zoho Auto-Verification**: Zoho checks automatically, but you can refresh the page
3. **Default Selector**: Make sure the selector you create is set as "default" if Zoho asks
4. **One Selector**: You typically only need one DKIM selector for the domain

---

## 🆘 Troubleshooting

### If DKIM doesn't verify:
1. **Check DNS Record**:
   - Verify the TXT record is added correctly
   - Check for typos in the name or value
   - Ensure no extra spaces or quotes

2. **Wait Longer**:
   - DNS can take time to propagate
   - Check globally: https://www.whatsmydns.net/

3. **Verify Record Format**:
   - Should start with: `v=DKIM1; k=rsa; p=`
   - Should be one continuous string (no line breaks)

4. **Contact Zoho Support**:
   - If still not working after 24 hours
   - https://help.zoho.com/

---

## ✅ Success Checklist

- [ ] Clicked "+ Add" button in Zoho
- [ ] Copied TXT Name/Host from Zoho
- [ ] Copied TXT Value from Zoho
- [ ] Added TXT record to DNS provider
- [ ] Waited 5-15 minutes for propagation
- [ ] Verified record shows in Zoho
- [ ] Status shows "Verified" (green checkmark)
- [ ] Enabled DKIM toggle
- [ ] Tested with MXToolbox (shows valid)
- [ ] Sent test email (DKIM: PASS in headers)

---

**Next Steps After DKIM Setup:**
1. Complete SPF record fix (remove duplicates)
2. Update DMARC record (add ruf and fo)
3. Test all three: SPF, DKIM, DMARC
4. Send test emails to verify deliverability

