/**
 * Unlike static detector, dynamic detector code runs in the page context.
 * Therefore, the function MUST be self-contained, meaning any utility code has to reside in this function itself.
 * Also the function MUST be serializable, and the result must ALSO be serializable.
 * @return {import("./static_detector").SpaDetectorOutput}
 */
function dynamicScanForSPAFramework() {
  let output = {}

  try {
    const ConfidenceLevel = {
      LOW: 0,
      MEDIUM: 1,
      HIGH: 2
    };

    // Handle Vue case
    if (window.Vue) {
      output["vue"] = {
        version: window.Vue.version,
        reasonURL: window.location.href,
        confidence: ConfidenceLevel.HIGH,
        isStatic: false,
      };
    } else {
      const all = document.querySelectorAll('*')
      for (let i = 0; i < all.length; i++) {
        if (all[i].__vue__) {
          output["vue"] = {
            reasonURL: window.location.href,
            confidence: ConfidenceLevel.MEDIUM,
            isStatic: false,
          };
          break;
        }
      }
    }

    // Handle React case

    // NOTICE: https://github.com/facebook/react/blob/08c1f79e1e13719ae2b79240bbd8f97178ddd791/packages/react-devtools-extensions/src/injectGlobalHook.js
    // By loading the react-devtools extension, we are able to capture version number of ReactDOM (which is fine) that is somewhat new enough (after React Devtools come around).
    // Per https://reactjs.org/blog/2019/08/15/new-react-devtools.html, should work for 15.x+.
    // To load an extension, see this: https://dev.to/ajaykumbhare/load-chrome-extensions-in-puppeteer-4fk0
    // Caveat: can be explicitly disabled: https://stackoverflow.com/questions/42196819/disable-hide-download-the-react-devtools. But likely rare
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      for (const renderer of window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.values()) {
        if (renderer.version) {
          output["react"] = {
            version: renderer.version,
            reasonURL: window.location.href,
            confidence: ConfidenceLevel.HIGH,
            isStatic: false,
          }
        }
      }
    }

    // Handle AngularJS case
    if (window.angular) {
      output["angularjs"] = {
        version: window.angular.version.full,
        reasonURL: window.location.href,
        confidence: ConfidenceLevel.HIGH,
        isStatic: false,
      }
    }

    // Handle Angular2
    if (window.ng) {
      output["angular"] = {
        reasonURL: window.location.href,
        confidence: ConfidenceLevel.MEDIUM,
        isStatic: false,
      }
    }

    // Handle Ember
    if (window.Ember) {
      output["ember"] = {
        version: window.Ember.VERSION,
        reasonURL: window.location.href,
        confidence: ConfidenceLevel.HIGH,
        isStatic: false,
      }
    }
  } catch (e) {}

  return output;
}

module.exports = {
  dynamicScanForSPAFramework,
};
