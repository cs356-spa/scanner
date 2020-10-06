/**
 * Unlike static detector, dynamic detector code runs in the page context.
 * Therefore, the function MUST be self-contained, meaning any utility code has to reside in this function itself.
 * Also the function MUST be serializable, and the result must ALSO be serializable.
 * @return {import("./static_detector").SpaDetectorOutput}
 */
function dynamicScanForSPA() {
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
    // Suspicion that we can get better results by reverse engineering https://github.com/facebook/react/blob/08c1f79e1e13719ae2b79240bbd8f97178ddd791/packages/react-devtools-extensions/src/injectGlobalHook.js
    // For now, no better way.

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
  } catch (e) {}

  return output;
}

module.exports = {
  dynamicScanForSPA,
};
