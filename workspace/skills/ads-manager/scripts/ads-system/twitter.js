class Twitter {
  getConfig(action, args, creds) {
    const { accountId, campaignId, adSetId, adId, mediaId, audienceId, data } = args;
    const baseUrl = "https://ads-api.twitter.com/12";
    let c = { method: "GET", url: "", headers: { "Authorization": `Bearer ${creds.token}`, "Content-Type": "application/json" }, body: null };
    switch (action) {
      case "getCampaigns":
      case "listCampaigns": c.url = `${baseUrl}/accounts/${accountId}/campaigns`; break;
      case "getCampaign": c.url = `${baseUrl}/accounts/${accountId}/campaigns/${campaignId}`; break;
      case "createCampaign": c.method = "POST"; c.url = `${baseUrl}/accounts/${accountId}/campaigns`; c.body = data; break;
      case "updateCampaign": c.method = "PUT"; c.url = `${baseUrl}/accounts/${accountId}/campaigns/${campaignId}`; c.body = data; break;
      case "deleteCampaign": c.method = "DELETE"; c.url = `${baseUrl}/accounts/${accountId}/campaigns/${campaignId}`; break;
      case "getAdSets": c.url = `${baseUrl}/accounts/${accountId}/line_items`; break;
      case "getAdSet": c.url = `${baseUrl}/accounts/${accountId}/line_items/${adSetId}`; break;
      case "createAdSet": c.method = "POST"; c.url = `${baseUrl}/accounts/${accountId}/line_items`; c.body = data; break;
      case "updateAdSet": c.method = "PUT"; c.url = `${baseUrl}/accounts/${accountId}/line_items/${adSetId}`; c.body = data; break;
      case "deleteAdSet": c.method = "DELETE"; c.url = `${baseUrl}/accounts/${accountId}/line_items/${adSetId}`; break;
      case "getAds": c.url = `${baseUrl}/accounts/${accountId}/promoted_tweets`; break;
      case "getAd": c.url = `${baseUrl}/accounts/${accountId}/promoted_tweets/${adId}`; break;
      case "createAd": c.method = "POST"; c.url = `${baseUrl}/accounts/${accountId}/promoted_tweets`; c.body = data; break;
      case "deleteAd": c.method = "DELETE"; c.url = `${baseUrl}/accounts/${accountId}/promoted_tweets/${adId}`; break;
      case "uploadMedia": c.method = "POST"; c.url = `${baseUrl}/accounts/${accountId}/media/library`; c.body = data; break;
      case "getMedia": c.url = `${baseUrl}/accounts/${accountId}/media/library/${mediaId}`; break;
      case "getAudiences": c.url = `${baseUrl}/accounts/${accountId}/custom_audiences`; break;
      case "createAudience": c.method = "POST"; c.url = `${baseUrl}/accounts/${accountId}/custom_audiences`; c.body = data; break;
      case "getCampaignInsights": c.url = `${baseUrl}/stats/accounts/${accountId}/campaigns`; break;
      case "getAccount": c.url = `${baseUrl}/accounts/${accountId}`; break;
      case "validatePayload": return { valid: !!data };
      default: return null;
    }
    return c;
  }
}
export default new Twitter();
