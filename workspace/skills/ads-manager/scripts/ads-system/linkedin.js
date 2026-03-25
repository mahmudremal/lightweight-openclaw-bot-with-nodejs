class LinkedIn {
  getConfig(action, args, creds) {
    const { accountId, campaignId, adSetId, adId, mediaId, audienceId, data } = args;
    const baseUrl = "https://api.linkedin.com/rest";
    let c = { method: "GET", url: "", headers: { "Authorization": `Bearer ${creds.token}`, "LinkedIn-Version": "202306", "Content-Type": "application/json" }, body: null };
    const patchBody = data ? { patch: { $set: data } } : null;
    switch (action) {
      case "getCampaigns":
      case "listCampaigns": c.url = `${baseUrl}/adCampaigns?q=search&search=(account:(values:List(urn:li:sponsoredAccount:${accountId})))`; break;
      case "getCampaign": c.url = `${baseUrl}/adCampaigns/${campaignId}`; break;
      case "createCampaign": c.method = "POST"; c.url = `${baseUrl}/adCampaigns`; c.body = data; break;
      case "updateCampaign": c.method = "POST"; c.url = `${baseUrl}/adCampaigns/${campaignId}`; c.headers["X-RestLi-Method"] = "PARTIAL_UPDATE"; c.body = patchBody; break;
      case "deleteCampaign": c.method = "DELETE"; c.url = `${baseUrl}/adCampaigns/${campaignId}`; break;
      case "getAdSets": c.url = `${baseUrl}/adCampaignGroups?q=search&search=(account:(values:List(urn:li:sponsoredAccount:${accountId})))`; break;
      case "getAdSet": c.url = `${baseUrl}/adCampaignGroups/${adSetId}`; break;
      case "createAdSet": c.method = "POST"; c.url = `${baseUrl}/adCampaignGroups`; c.body = data; break;
      case "updateAdSet": c.method = "POST"; c.url = `${baseUrl}/adCampaignGroups/${adSetId}`; c.headers["X-RestLi-Method"] = "PARTIAL_UPDATE"; c.body = patchBody; break;
      case "getAds": c.url = `${baseUrl}/adCreatives?q=search&search=(campaign:(values:List(urn:li:sponsoredCampaign:${campaignId})))`; break;
      case "getAd": c.url = `${baseUrl}/adCreatives/${adId}`; break;
      case "createAd": c.method = "POST"; c.url = `${baseUrl}/adCreatives`; c.body = data; break;
      case "updateAd": c.method = "POST"; c.url = `${baseUrl}/adCreatives/${adId}`; c.headers["X-RestLi-Method"] = "PARTIAL_UPDATE"; c.body = patchBody; break;
      case "deleteAd": c.method = "DELETE"; c.url = `${baseUrl}/adCreatives/${adId}`; break;
      case "uploadMedia": c.method = "POST"; c.url = `${baseUrl}/images?action=initializeUpload`; c.body = data; break;
      case "getMedia": c.url = `${baseUrl}/images/${mediaId}`; break;
      case "getAudiences": c.url = `${baseUrl}/dmpSegments?q=account&account=urn:li:sponsoredAccount:${accountId}`; break;
      case "createAudience": c.method = "POST"; c.url = `${baseUrl}/dmpSegments`; c.body = data; break;
      case "getCampaignInsights": c.url = `${baseUrl}/adAnalytics?q=analytics&pivot=CAMPAIGN&dateRange=(start:(year:2023,month:1,day:1))&campaigns[0]=urn:li:sponsoredCampaign:${campaignId}`; break;
      case "getAccount": c.url = `${baseUrl}/sponsoredAccounts/${accountId}`; break;
      case "validatePayload": return { valid: !!data };
      default: return null;
    }
    return c;
  }
}
export default new LinkedIn();
