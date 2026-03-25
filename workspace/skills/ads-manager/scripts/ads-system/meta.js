class Meta {
  getConfig(action, args, creds) {
    const { accountId, campaignId, adSetId, adId, mediaId, audienceId, data } = args;
    const baseUrl = "https://graph.facebook.com/v19.0";
    let c = { method: "GET", url: "", headers: { "Authorization": `Bearer ${creds.token}`, "Content-Type": "application/json" }, body: null };
    switch (action) {
      case "getCampaigns": c.url = `${baseUrl}/act_${accountId}/campaigns?fields=id,name,status`; break;
      case "listCampaigns": c.url = `${baseUrl}/act_${accountId}/campaigns`; break;
      case "getCampaign": c.url = `${baseUrl}/${campaignId}`; break;
      case "createCampaign": c.method = "POST"; c.url = `${baseUrl}/act_${accountId}/campaigns`; c.body = data; break;
      case "updateCampaign": c.method = "POST"; c.url = `${baseUrl}/${campaignId}`; c.body = data; break;
      case "deleteCampaign": c.method = "DELETE"; c.url = `${baseUrl}/${campaignId}`; break;
      case "archiveCampaign": c.method = "POST"; c.url = `${baseUrl}/${campaignId}`; c.body = { status: "ARCHIVED" }; break;
      case "duplicateCampaign": c.method = "POST"; c.url = `${baseUrl}/${campaignId}/copies`; break;
      case "getAdSets": c.url = `${baseUrl}/act_${accountId}/adsets`; break;
      case "getAdSet": c.url = `${baseUrl}/${adSetId}`; break;
      case "createAdSet": c.method = "POST"; c.url = `${baseUrl}/act_${accountId}/adsets`; c.body = data; break;
      case "updateAdSet": c.method = "POST"; c.url = `${baseUrl}/${adSetId}`; c.body = data; break;
      case "deleteAdSet": c.method = "DELETE"; c.url = `${baseUrl}/${adSetId}`; break;
      case "getAds": c.url = `${baseUrl}/act_${accountId}/ads`; break;
      case "getAd": c.url = `${baseUrl}/${adId}`; break;
      case "createAd": c.method = "POST"; c.url = `${baseUrl}/act_${accountId}/ads`; c.body = data; break;
      case "updateAd": c.method = "POST"; c.url = `${baseUrl}/${adId}`; c.body = data; break;
      case "deleteAd": c.method = "DELETE"; c.url = `${baseUrl}/${adId}`; break;
      case "uploadMedia": c.method = "POST"; c.url = `${baseUrl}/act_${accountId}/advideos`; c.body = data; break;
      case "getMedia": c.url = `${baseUrl}/${mediaId}`; break;
      case "deleteMedia": c.method = "DELETE"; c.url = `${baseUrl}/${mediaId}`; break;
      case "getAudiences": c.url = `${baseUrl}/act_${accountId}/customaudiences`; break;
      case "createAudience": c.method = "POST"; c.url = `${baseUrl}/act_${accountId}/customaudiences`; c.body = data; break;
      case "updateAudience": c.method = "POST"; c.url = `${baseUrl}/${audienceId}`; c.body = data; break;
      case "deleteAudience": c.method = "DELETE"; c.url = `${baseUrl}/${audienceId}`; break;
      case "updateBudget": c.method = "POST"; c.url = `${baseUrl}/${campaignId}`; c.body = data; break;
      case "updateBiddingStrategy": c.method = "POST"; c.url = `${baseUrl}/${campaignId}`; c.body = data; break;
      case "getCampaignInsights": c.url = `${baseUrl}/${campaignId}/insights`; break;
      case "getAdSetInsights": c.url = `${baseUrl}/${adSetId}/insights`; break;
      case "getAdInsights": c.url = `${baseUrl}/${adId}/insights`; break;
      case "getAccount": c.url = `${baseUrl}/act_${accountId}`; break;
      case "getAccountBalance": c.url = `${baseUrl}/act_${accountId}?fields=balance`; break;
      case "getBillingInfo": c.url = `${baseUrl}/act_${accountId}?fields=funding_source_details`; break;
      case "validatePayload": return { valid: !!data };
      case "estimateReach": c.method = "GET"; c.url = `${baseUrl}/act_${accountId}/reachestimate`; break;
      default: return null;
    }
    return c;
  }
}
export default new Meta();
