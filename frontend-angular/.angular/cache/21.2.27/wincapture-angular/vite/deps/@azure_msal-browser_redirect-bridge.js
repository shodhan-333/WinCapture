import {
  ApiId,
  DEFAULT_REDIRECT_TIMEOUT_MS,
  INTERACTION_TYPE,
  InteractionType,
  NavigationClient,
  PREFIX,
  TemporaryCacheKeys,
  clearAuthResponseFromUrl,
  getHomepage,
  parseAuthResponseFromUrl
} from "./chunk-25LGWSWQ.js";
import {
  __async
} from "./chunk-PSGY5PZF.js";

// node_modules/@azure/msal-browser/dist/redirect_bridge/index.mjs
function broadcastResponseToMainFrame(navigationClient) {
  return __async(this, null, function* () {
    document.title = "Microsoft Authentication";
    let parsedResponse;
    try {
      parsedResponse = parseAuthResponseFromUrl();
    } catch (error) {
      clearAuthResponseFromUrl(window);
      throw error;
    }
    const { payload, urlHash, urlQuery, hasResponseInHash, hasResponseInQuery, libraryState } = parsedResponse;
    const { id, meta } = libraryState;
    if (meta["interactionType"] === InteractionType.Redirect) {
      const navClient = navigationClient || new NavigationClient();
      let navigateToUrl = "";
      let clientId = "";
      let interactionType = "";
      const interactionKey = `${PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
      try {
        const rawInteractionStatus = window.sessionStorage.getItem(interactionKey);
        const interactionStatus = JSON.parse(rawInteractionStatus || "");
        clientId = interactionStatus.clientId || "";
        interactionType = interactionStatus.type;
        if (clientId) {
          const originKey = `${PREFIX}.${clientId}.${TemporaryCacheKeys.ORIGIN_URI}`;
          navigateToUrl = window.sessionStorage.getItem(originKey) || "";
        }
      } catch (e) {
      }
      const navigationOptions = {
        apiId: interactionType === INTERACTION_TYPE.SIGNOUT ? ApiId.logout : ApiId.handleRedirectPromise,
        noHistory: true,
        timeout: DEFAULT_REDIRECT_TIMEOUT_MS
      };
      if (clientId) {
        try {
          window.sessionStorage.setItem(`${PREFIX}.${clientId}.${TemporaryCacheKeys.URL_HASH}`, payload);
        } catch (e) {
        }
      }
      const url = navigateToUrl || getHomepage();
      const navigationUrl = url.endsWith("?") ? url.slice(0, -1) : url;
      yield navClient.navigateInternal(navigationUrl, navigationOptions);
      return;
    }
    if (typeof window.history.replaceState === "function") {
      let newUrl = `${window.location.origin}${window.location.pathname}`;
      if (!hasResponseInHash && urlHash) {
        newUrl += urlHash;
      }
      if (!hasResponseInQuery && urlQuery) {
        newUrl += urlQuery;
      }
      window.history.replaceState(null, "", newUrl);
    }
    const channel = new BroadcastChannel(id);
    channel.postMessage({
      v: 1,
      payload
    });
    channel.close();
    try {
      window.close();
    } catch (e) {
    }
  });
}
export {
  broadcastResponseToMainFrame
};
//# sourceMappingURL=@azure_msal-browser_redirect-bridge.js.map
