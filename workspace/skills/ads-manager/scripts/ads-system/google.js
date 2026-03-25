class Google {
  getConfig(action, args, creds, platform) {
    const { accountId, campaignId, adSetId, adId, mediaId, audienceId, data } = args;
    const baseUrl = `https://googleads.googleapis.com/v16/customers/${accountId}`;
    let c = { method: "POST", url: "", headers: { "Authorization": `Bearer ${creds.token}`, "developer-token": creds.developerToken, "Content-Type": "application/json" }, body: null };
    const pType = platform === 'youtube' ? 'VIDEO' : (platform === 'google-display' ? 'DISPLAY' : 'SEARCH');
    switch (action) {
      case "getCampaigns":
      case "listCampaigns": c.url = `${baseUrl}/googleAds:search`; c.body = { query: `SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.advertising_channel_type = '${pType}'` }; break;
      case "getCampaign": c.url = `${baseUrl}/googleAds:search`; c.body = { query: `SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.id = ${campaignId}` }; break;
      case "createCampaign": c.url = `${baseUrl}/campaigns:mutate`; c.body = { operations: [{ create: data }] }; break;
      case "updateCampaign": c.url = `${baseUrl}/campaigns:mutate`; c.body = { operations: [{ update: data, updateMask: Object.keys(data).filter(k=>k!=='attachments').join(",") }] }; break;
      case "deleteCampaign": c.url = `${baseUrl}/campaigns:mutate`; c.body = { operations: [{ remove: `customers/${accountId}/campaigns/${campaignId}` }] }; break;
      case "archiveCampaign": c.url = `${baseUrl}/campaigns:mutate`; c.body = { operations: [{ update: { resourceName: `customers/${accountId}/campaigns/${campaignId}`, status: 'PAUSED' }, updateMask: 'status' }] }; break;
      case "getAdSets": c.url = `${baseUrl}/googleAds:search`; c.body = { query: "SELECT ad_group.id, ad_group.name FROM ad_group" }; break;
      case "getAdSet": c.url = `${baseUrl}/googleAds:search`; c.body = { query: `SELECT ad_group.id, ad_group.name FROM ad_group WHERE ad_group.id = ${adSetId}` }; break;
      case "createAdSet": c.url = `${baseUrl}/adGroups:mutate`; c.body = { operations: [{ create: data }] }; break;
      case "updateAdSet": c.url = `${baseUrl}/adGroups:mutate`; c.body = { operations: [{ update: data, updateMask: Object.keys(data).join(",") }] }; break;
      case "deleteAdSet": c.url = `${baseUrl}/adGroups:mutate`; c.body = { operations: [{ remove: `customers/${accountId}/adGroups/${adSetId}` }] }; break;
      case "getAds": c.url = `${baseUrl}/googleAds:search`; c.body = { query: "SELECT ad_group_ad.ad.id, ad_group_ad.ad.name FROM ad_group_ad" }; break;
      case "getAd": c.url = `${baseUrl}/googleAds:search`; c.body = { query: `SELECT ad_group_ad.ad.id FROM ad_group_ad WHERE ad_group_ad.ad.id = ${adId}` }; break;
      case "createAd": c.url = `${baseUrl}/adGroupAds:mutate`; c.body = { operations: [{ create: data }] }; break;
      case "updateAd": c.url = `${baseUrl}/adGroupAds:mutate`; c.body = { operations: [{ update: data, updateMask: Object.keys(data).join(",") }] }; break;
      case "deleteAd": c.url = `${baseUrl}/adGroupAds:mutate`; c.body = { operations: [{ remove: `customers/${accountId}/adGroupAds/${adId}` }] }; break;
      case "uploadMedia": c.url = `${baseUrl}/mediaFiles:mutate`; c.body = { operations: [{ create: data }] }; break;
      case "getMedia": c.url = `${baseUrl}/googleAds:search`; c.body = { query: `SELECT media_file.id FROM media_file WHERE media_file.id = ${mediaId}` }; break;
      case "getAudiences": c.url = `${baseUrl}/googleAds:search`; c.body = { query: "SELECT user_list.id, user_list.name FROM user_list" }; break;
      case "createAudience": c.url = `${baseUrl}/userLists:mutate`; c.body = { operations: [{ create: data }] }; break;
      case "updateAudience": c.url = `${baseUrl}/userLists:mutate`; c.body = { operations: [{ update: data, updateMask: Object.keys(data).join(",") }] }; break;
      case "deleteAudience": c.url = `${baseUrl}/userLists:mutate`; c.body = { operations: [{ remove: `customers/${accountId}/userLists/${audienceId}` }] }; break;
      case "updateBudget": c.url = `${baseUrl}/campaignBudgets:mutate`; c.body = { operations: [{ update: data, updateMask: "amountMicros" }] }; break;
      case "getCampaignInsights": c.url = `${baseUrl}/googleAds:search`; c.body = { query: `SELECT metrics.impressions, metrics.clicks FROM campaign WHERE campaign.id = ${campaignId}` }; break;
      case "getAccount": c.url = `${baseUrl}/googleAds:search`; c.body = { query: "SELECT customer.id, customer.descriptive_name FROM customer" }; break;
      case "validatePayload": return { valid: !!data };
      default: return null;
    }
    return c;
  }
}
export default new Google();
