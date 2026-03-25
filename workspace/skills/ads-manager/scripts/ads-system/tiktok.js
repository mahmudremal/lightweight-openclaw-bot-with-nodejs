class TikTok {
  getConfig(action, args, creds) {
    const { accountId, campaignId, adSetId, adId, mediaId, audienceId, data } = args;
    const baseUrl = "https://business-api.tiktok.com/open_api/v1.3";
    let c = { method: "GET", url: "", headers: { "Access-Token": creds.token, "Content-Type": "application/json" }, body: null };
    switch (action) {
      case "getCampaigns":
      case "listCampaigns": c.url = `${baseUrl}/campaign/get/?advertiser_id=${accountId}`; break;
      case "getCampaign": c.url = `${baseUrl}/campaign/get/?advertiser_id=${accountId}&campaign_ids=["${campaignId}"]`; break;
      case "createCampaign": c.method = "POST"; c.url = `${baseUrl}/campaign/create/`; c.body = { advertiser_id: accountId, ...data }; break;
      case "updateCampaign": c.method = "POST"; c.url = `${baseUrl}/campaign/update/`; c.body = { advertiser_id: accountId, campaign_id: campaignId, ...data }; break;
      case "deleteCampaign":
      case "archiveCampaign": c.method = "POST"; c.url = `${baseUrl}/campaign/status/update/`; c.body = { advertiser_id: accountId, campaign_ids: [campaignId], operation_status: "DELETE" }; break;
      case "getAdSets": c.url = `${baseUrl}/adgroup/get/?advertiser_id=${accountId}`; break;
      case "getAdSet": c.url = `${baseUrl}/adgroup/get/?advertiser_id=${accountId}&adgroup_ids=["${adSetId}"]`; break;
      case "createAdSet": c.method = "POST"; c.url = `${baseUrl}/adgroup/create/`; c.body = { advertiser_id: accountId, ...data }; break;
      case "updateAdSet": c.method = "POST"; c.url = `${baseUrl}/adgroup/update/`; c.body = { advertiser_id: accountId, adgroup_id: adSetId, ...data }; break;
      case "getAds": c.url = `${baseUrl}/ad/get/?advertiser_id=${accountId}`; break;
      case "getAd": c.url = `${baseUrl}/ad/get/?advertiser_id=${accountId}&ad_ids=["${adId}"]`; break;
      case "createAd": c.method = "POST"; c.url = `${baseUrl}/ad/create/`; c.body = { advertiser_id: accountId, ...data }; break;
      case "updateAd": c.method = "POST"; c.url = `${baseUrl}/ad/update/`; c.body = { advertiser_id: accountId, ad_id: adId, ...data }; break;
      case "uploadMedia": c.method = "POST"; c.url = `${baseUrl}/file/video/ad/upload/`; c.body = { advertiser_id: accountId, ...data }; break;
      case "getMedia": c.url = `${baseUrl}/file/video/ad/search/?advertiser_id=${accountId}&video_ids=["${mediaId}"]`; break;
      case "getAudiences": c.url = `${baseUrl}/dmp/custom_audience/list/?advertiser_id=${accountId}`; break;
      case "createAudience": c.method = "POST"; c.url = `${baseUrl}/dmp/custom_audience/create/`; c.body = { advertiser_id: accountId, ...data }; break;
      case "updateAudience": c.method = "POST"; c.url = `${baseUrl}/dmp/custom_audience/update/`; c.body = { advertiser_id: accountId, custom_audience_id: audienceId, ...data }; break;
      case "deleteAudience": c.method = "POST"; c.url = `${baseUrl}/dmp/custom_audience/delete/`; c.body = { advertiser_id: accountId, custom_audience_id: audienceId }; break;
      case "getCampaignInsights": c.url = `${baseUrl}/report/integrated/get/?advertiser_id=${accountId}&report_type=BASIC&data_level=AUCTION_CAMPAIGN`; break;
      case "getAdSetInsights": c.url = `${baseUrl}/report/integrated/get/?advertiser_id=${accountId}&report_type=BASIC&data_level=AUCTION_ADGROUP`; break;
      case "getAdInsights": c.url = `${baseUrl}/report/integrated/get/?advertiser_id=${accountId}&report_type=BASIC&data_level=AUCTION_AD`; break;
      case "getAccount": c.url = `${baseUrl}/advertiser/info/?advertiser_ids=["${accountId}"]`; break;
      case "getAccountBalance": c.url = `${baseUrl}/advertiser/balance/get/?advertiser_id=${accountId}`; break;
      case "validatePayload": return { valid: !!data };
      default: return null;
    }
    return c;
  }
}
export default new TikTok();
