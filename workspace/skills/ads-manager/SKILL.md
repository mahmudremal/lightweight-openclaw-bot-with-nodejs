---
name: ads-manager
description: Manage ads campaigns
metadata:
  emoji: "📈"
---

# Ads Manager

Command template: `node scripts/ads.js --platform=[PLATFORM] --action=[ACTION] [OPTIONS...]`

## Platforms & Actions
**Platforms:** `meta`, `tiktok`, `google-search`, `google-display`, `youtube`, `twitter`, `linkedin`
**Actions:**
- **Campaign**: `getCampaigns`, `getCampaign`, `listCampaigns`, `createCampaign` *(Requires Human Confirmation)*, `updateCampaign` *(Requires Human Confirmation)*, `deleteCampaign`, `archiveCampaign`, `duplicateCampaign`
- **Ad Set**: `getAdSets`, `getAdSet`, `createAdSet`, `updateAdSet`, `deleteAdSet`
- **Ad**: `getAds`, `getAd`, `createAd`, `updateAd`, `deleteAd`
- **Media**: `uploadMedia`, `getMedia`, `deleteMedia`
- **Audience**: `getAudiences`, `createAudience`, `updateAudience`, `deleteAudience`
- **Budget**: `updateBudget`, `updateBiddingStrategy`
- **Insights**: `getCampaignInsights`, `getAdSetInsights`, `getAdInsights`
- **Account**: `getAccount`, `getAccountBalance`, `getBillingInfo`
- **Utility**: `validatePayload`, `previewCampaign`, `estimateReach`, `checkPolicyCompliance`
- **System**: `syncAccounts`, `mapPlatformIds`, `retryFailedTasks`

## Parameters
| Parameter | Required For | Description |
|-----------|--------------|-------------|
| `--platform` | ALL | Target platform (meta/tiktok/google-search/google-display/youtube/twitter/linkedin) |
| `--action` | ALL | Action to perform |
| `--accountId` | ALL | The ad account ID |
| `--campaignId` | `updateCampaign` | ID of the campaign to modify |
| `--data` | `createCampaign`, `updateCampaign` | Valid JSON string with campaign details |
| `--attachment`| Optional | Absolute path(s) to media files, comma separated (e.g. `/path/img.png`) |

## ⚠️ Safety & Confirmation Rules
**CRITICAL:** Actions `createCampaign` and `updateCampaign` involve spending real money.
1. Formulate the exact command you intend to run.
2. **DO NOT EXECUTE IT YET.**
3. Send a message to the user detailing the planned changes (including media attachments) and ask for confirmation.
4. Put the intended action in memory.
5. Pause and wait for the user to approve. 
6. Once approved, execute the command.

## Examples
**1. Read YouTube Ads:**
`node scripts/ads.js --platform=youtube --action=getCampaigns --accountId=12345`

**2. Create Meta Campaign with Media (After User Approval):**
`node scripts/ads.js --platform=meta --action=createCampaign --accountId=12345 --attachment=/files/video.mp4 --data='{"name":"Promo","status":"PAUSED"}'`

**3. Update LinkedIn Campaign (After User Approval):**
`node scripts/ads.js --platform=linkedin --action=updateCampaign --accountId=12345 --campaignId=999 --data='{"status":"PAUSED"}'`

If platform is missing from `secrets.json`, prompt user to properly configure it.
