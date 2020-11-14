import { parseBundleString } from "./package_analyzer/parseUtils";

// type SpaType = "react"|"angular"|"angularjs"|"vue";
export const SPA_TYPES = ["react", "angular", "angularjs", "vue"] as const;
export type SpaType = typeof SPA_TYPES[number];

interface Source {
  url: string;
  content: string;
}

interface SpaInfo {
  version?: string,
  reasonURL: string,
  confidence: number,
  isStatic: boolean
}

export type SpaDetectorOutput = {
  [x in SpaType]: SpaInfo;
} | {};


const ConfidenceLevel = {
  LOW: 0,
  MEDIUM: 1, // When no version is found, this is the MAX level we would ever set.
  HIGH: 2,
};

/**
 * 
 * @param {SpaDetectorOutput} output
 * @param {SpaType} spaType
 * @param {SpaInfo} info
 */
export function mergeOutput(output: SpaDetectorOutput, spaType: SpaType, info: SpaInfo) {
  if (!(spaType in output) || (info.confidence >= output[spaType]!.confidence && !output[spaType]!.version)) {
    output[spaType] = info;
  } else if (!output[spaType]!.version && info.version) {
    output[spaType]!.version = info.version;
    if (info.reasonURL) {
      output[spaType]!.reasonURL = info.reasonURL;
    }
    // Confidence level inherits previous level
  }
}

/**
 * @param {SpaDetectorOutput} output1 
 * @param {SpaDetectorOutput} output2
 * @returns {SpaDetectorOutput}
 */
export function mergeDetectorOutput(output1: SpaDetectorOutput, output2: SpaDetectorOutput) {
  const output = {...output1};
  for (const k in output2) {
    mergeOutput(output, k as SpaType, output2[k])
  }
  return output;
}

/**
 * @param {string} fileURL
 * @return {boolean}
 */
export function isURLFileTypeHTML(fileURL: string): boolean {
  try {
    const url = new URL(fileURL);
    // Basic extension check
    if (url.pathname.endsWith(".html") || url.pathname.endsWith(".htm")) {
      return true;
    }
    // For root page, likely HTML
    if (url.pathname.endsWith("/") || url.pathname === "") {
      return true;
    }
    // For url path where last chunk does not contain any dots (likely no extensions), likely HTML
    const pathChunks = url.pathname.split("/");
    if (pathChunks && !pathChunks.includes(".")) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * @param {string} fileURL
 * @return {boolean}
 */
export function isURLFileTypeJS(fileURL: string): boolean {
  try {
    const url = new URL(fileURL);
    // Basic extension check. This avoids the query/hash at the end problem.
    if (url.pathname.endsWith(".js") || url.pathname.endsWith(".mjs")) {
      return true;
    }
    // TODO: may be improved by getting MIME type instead of extension.
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * @param {string} fileURL 
 * @param {string} hostname e.g. google.com
 * @returns {boolean}
 */
export function isFileLikelyFirstParty(fileURL: string, hostname: string): boolean {
  // Retrieve identifier of host, usually the second level domain name.
  const hostnameSegments = hostname.split(".");
  const hostId = hostnameSegments.length >= 2 ? hostnameSegments[hostnameSegments.length-2] : "";
  return fileURL.includes(hostId)
}

/**
 * @param {SpaDetectorOutput} output
 * @param {string} content 
 * @param {string} fileURL
 */
export function handleHTMLFile(output: SpaDetectorOutput, content: string, fileURL: string) {
  // Angular2 version directly from HTML file
  // https://github.com/angular/angular/issues/16283
  const angular2VersionRegex = /ng\-version=['"]([0-9\.]+)['"]/i; // ignore case
  const angular2VersionResult = angular2VersionRegex.exec(content);
  if (angular2VersionResult && angular2VersionResult[1]) {
    mergeOutput(output, "angular", {
      version: angular2VersionResult[1],
      reasonURL: fileURL,
      confidence: ConfidenceLevel.HIGH,
      isStatic: true,
    });
  }

  // React rough detection
  // Below 2 actually also implies React version < 0.15.0 (aka React 15)
  const reactDataRegex1 = /data\-reactid/i; // only occurs before React 15, see https://stackoverflow.com/questions/17585787/whats-data-reactid-attribute-in-html
  const reactDataRegex2 = /data\-reactroot/i; // similar as before. https://github.com/kentcdodds/react-detector/blob/master/content-script.js
  if (reactDataRegex1.test(content) || reactDataRegex2.test(content)) {
    mergeOutput(output, "react", {
      reasonURL: fileURL,
      confidence: ConfidenceLevel.MEDIUM,
      isStatic: true,
    });
  }
}

const CONTEXT_LOOKAROUND_OFFSET = 500;
// This might either match to React of ReactDOM, but either is fine.
const REACT_LOOKALIKE_IDS = [
  // // Lifecycle names
  // "componentDidMount", "componentWillMount",
  // // Hooks
  // "useState", "useEffect",
  // // Secret internals
  // "DO_NOT_USE_OR_YOU_WILL_BE_FIRED",
  // This is confirmed to be present next to React version from 0.5.0 to 0.13.3
  // For example:
  // 0.5.0: https://github.com/facebook/react/blob/f756cb3d9c504b3759fb4cc4f5aec1d1e4d31ee8/src/core/React.js#L63-L69
  // 0.12.2: https://github.com/facebook/react/blob/1e1f02a83ab2972de72acab90b7cf4769adba9e1/src/browser/ui/React.js#L131-L182
  // 0.13.3: https://github.com/facebook/react/blob/668d6a3fededd5e7babd533d5538982eb1d496fa/src/browser/ui/React.js#L97-L146
  "CurrentOwner",
  // Likely will work in a way similar to that devtools (part of the renderer details). Example: https://webpack.js.org/vendor.bundle.js
  "rendererPackageName"
  // TODO: find more possible identifiers based on older versions of React bundles.
];
// For Vue 2. See discussion below.
const VUE_2_LOOKALIKE_IDS = [
  "$isServer",
  "$ssrContext",
  "FunctionalRenderContext"
];
// For AngularJS. These are property names that will be injected to `window.angular`. If they are all present right next to each other, very likely to be using AngularJS
const ANGULARJS_LOOKALIKE_IDS = [
  "full",
  "major",
  "minor",
  "dot",
  "codeName"
];

/**
 * @param content target content to search a regex on
 * @param regex regex for version extraction.
 * @param nearbyPatterns a list of strings that ANY of which, if found near the matched result, means we have found the right regex matched result.
 */
function searchWithRegexAndConfirmByAnyNearbyPattern(content: string, regex: RegExp, nearbyPatterns: string[]): string | null {
  let result;
  while ((result = regex.exec(content)) !== null) {
    const version = result[0].replace(/["'`]/g, ""); // drop wrapping quotes. I could have used lookahead/lookbehind but unsure about lookbehind support in JS yet.
    const contextSubstringFromContent = content.substring(result.index-CONTEXT_LOOKAROUND_OFFSET, result.index+CONTEXT_LOOKAROUND_OFFSET); // take a substring around the target index of found version string
    for (const lookAlikeId of nearbyPatterns) {
      if (contextSubstringFromContent.toLowerCase().includes(lookAlikeId.toLowerCase())) { // Somehow for whatever reason context string is actually lowercase... (it is because I messed up before lols)
        return version;
      }
    }
  }
  return null;
}

/**
 * @param content target content to search a regex on
 * @param regex regex for version extraction.
 * @param nearbyPatterns a list of strings that ALL of which, if found near the matched result, means we have found the right regex matched result.
 */
function searchWithRegexAndConfirmByAllNearbyPattern(content: string, regex: RegExp, nearbyPatterns: string[]): string | null {
  let result;
  regexLoop:
  while ((result = regex.exec(content)) !== null) {
    const version = result[0].replace(/["'`]/g, ""); // drop wrapping quotes. I could have used lookahead/lookbehind but unsure about lookbehind support in JS yet.
    const contextSubstringFromContent = content.substring(result.index-CONTEXT_LOOKAROUND_OFFSET, result.index+CONTEXT_LOOKAROUND_OFFSET); // take a substring around the target index of found version string
    for (const lookAlikeId of nearbyPatterns) {
      if (!contextSubstringFromContent.toLowerCase().includes(lookAlikeId.toLowerCase())) { // Somehow for whatever reason context string is actually lowercase... (it is because I messed up before lols)
        continue regexLoop; // Break outside!
      }
    }
    return version;
  }
  return null;
}

/**
 * @param {SpaDetectorOutput} output
 * @param {string} content 
 * @param {string} fileURL
 */
export function handleJSFile(output: SpaDetectorOutput, content: string, fileURL: string) {
  // TODO: Mostly handle React here. We can expand around a particular string and search nearby version
  // Per https://github.com/facebook/react/pull/4901#issuecomment-142139400, added in 0.14.x (dates back to 2015)
  // An estimate is that given, http://web.archive.org/web/20130607112820/facebook.github.io/react, we have 0.3.x during 2013 (initial public release on May 29, 2013)
  // the based on http://web.archive.org/web/20140714012722/facebook.github.io/react, quickly forwards to 0.10.x in 2014. Also see https://en.wikipedia.org/wiki/React_(web_framework)#History
  if (content.includes("__SECRET_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED")) {
    mergeOutput(output, "react", {
      reasonURL: fileURL,
      confidence: ConfidenceLevel.MEDIUM,
      isStatic: true,
    });
  }
  // Special strategy: Scan for a version string pattern. For each match, scan neighboring 1000 strings to see if React-like strings appear.
  const reactVersionRegex = /(?:"|'|`)(?:0|1[0-7])\.[0-9]*\.[0.9]*[^"'`]*(?:"|'|`)/g; // Idea: either starts with 0.x.x, or (10 to 17).x.x. Must be immediately wrapped by a string marker.
  const reactVersion = searchWithRegexAndConfirmByAnyNearbyPattern(content, reactVersionRegex, REACT_LOOKALIKE_IDS);
  if (reactVersion !== null) {
    mergeOutput(output, "react", {
      version: reactVersion,
      reasonURL: fileURL,
      confidence: ConfidenceLevel.MEDIUM, // We are less sure about this.
      isStatic: true,
    });
  }

  // Since sometimes Vue global namespace is hidden (example: https://9gag.com), we better implement Vue static analysis.
  // From samples such as https://9gag.com/s/fab0aa49/98549adbcf1b41cd36713316980d65f5ced8af12/static/dist/es8/web/js/vendor.js
  // which corresponds to https://github.com/vuejs/vue/blob/52719ccab8fccffbdf497b96d3731dc86f04c1ce/src/core/index.js#L20-L24
  // We can rely on keyword "$isServer" (or "FunctionalRenderContext") existance to ensure we are seeing the right version.
  // $isServer is added in early 2016, before Vue 2.0: https://github.com/vuejs/vue/commit/354ea616b5ec4826e23a88465e404fd3b382d9f4
  // and it is seen right next to version exactly at 2.0.0 release: https://github.com/vuejs/vue/blob/156cfb9892d3359d548e27abf5d8b78b421a5a92/src/core/index.js
  // FunctionalRenderContext is added in 2018.
  // Historically, Vue started to gain popularity after this tweet: https://twitter.com/taylorotwell/status/590281695581982720
  // which dates back to 2015. Vue 2 started in 2016, so it would be reasonable to only handle Vue 2 cases only.
  // Vue 3 has just released, yet too new such that we don't necessarily need to worry about it yet. (It's much harder to find Vue 3 version unfortunately...)
  const vueVersionRegex = /(?:"|'|`)2\.[0-9]*\.[0.9]*[^"'`]*(?:"|'|`)/g; // Vue 2 only.
  const vueVersion = searchWithRegexAndConfirmByAnyNearbyPattern(content, vueVersionRegex, VUE_2_LOOKALIKE_IDS);
  if (vueVersion !== null) {
    mergeOutput(output, "vue", {
      version: vueVersion,
      reasonURL: fileURL,
      confidence: ConfidenceLevel.MEDIUM, // We are less sure about this.
      isStatic: true,
    });
  }

  // For AngularJS. One difference is that we require ALL nearby patterns found.
  const angularJSVersionRegex = /(?:"|'|`)1\.[0-9]*\.[0.9]*[^"'`]*(?:"|'|`)/g; // AngularJS 1.x only
  const angularJSVersion = searchWithRegexAndConfirmByAllNearbyPattern(content, angularJSVersionRegex, ANGULARJS_LOOKALIKE_IDS); // NOTICE: this is ALL, NOT ANY!
  if (angularJSVersion !== null) {
    mergeOutput(output, "angularjs", {
      version: angularJSVersion,
      reasonURL: fileURL,
      confidence: ConfidenceLevel.MEDIUM, // We are less sure about this.
      isStatic: true,
    });
  }
}

/**
 * @param {Source[]} sources
 * @param {string} host
 * @param {boolean=} allowThirdParty TODO: get this work.
 * @returns {SpaDetectorOutput}
 */
export function staticScanForSPAFramework(sources: Source[], host: string, allowThirdParty: boolean = true): SpaDetectorOutput {
  const output = {}
  for (const source of sources) {
    if (isURLFileTypeJS(source.url) /* && isFileLikelyFirstParty(source.url, host) */) { // TODO: enforce no third-party?
      handleJSFile(output, source.content, source.url)
    } else if (isURLFileTypeHTML(source.url)) {
      handleHTMLFile(output, source.content, source.url);
    }
    // TODO: handle LICENSE files. This will require very special parsing strategy.
  }
  return output;
}

/**
 * Heuristic to test if the source is a bundled file
 * @param {Source} source 
 * @returns {boolean}
 */
export function isBundledFile(source: Source): boolean {
  // If the file is NOT a JS file, trivially return false
  if (!isURLFileTypeJS(source.url)) {
    return false;
  }
  // If the file is TOO small, we trivially consider it NOT a bundle (even if actually Webpack is used) as it should not be a core part of SPA anyways.
  if (source.content.length < 1000) {
    return false;
  }
  // If .chunk or chunk. or .bundle/bundle. is present as part of the file, very likely it is a bundled file. (either a chunk or a full independent bundle)
  const pathSegments = source.url.split("/");
  const filename = pathSegments.length > 0 ? pathSegments[pathSegments.length-1] : ""; // length == 0 can happen when URL for some weird reason is missing.
  if (filename.includes(".chunk") || filename.includes("chunk.") || filename.includes(".bundle") || filename.includes("bundle.")) {
    return true;
  }
  // Most common bundle type is Webpack, so check if Webpack (webpackJsonp/webpackChunk) is ever mentioned
  // webpackJsonp example: https://reactjs.org/app-da93669150e5bde53c5c.js (url might change, but starts with "app")
  // webpackChunk example: https://webpack.js.org/vendor.bundle.js
  if (source.content.includes("webpackJsonp") || source.content.includes("webpackChunk")) {
    return true;
  }
  // At this stage, we only consider possibly a bundle if the file is minified (typical for SPA). As a conservative measure, set 10 as boundary (in case LICENSE comments etc. at top. This is guarded that this 10 lines will have a lot of characters)
  if (source.content.split("\n").length < 10) {
    // TODO: add more criteria. For now, just return True
    return true;
  } else {
    return false;
  }
}

/**
 * Heuristic to test if the source is a bundled file, but very strict.
 * @param {Source} source 
 * @returns {boolean}
 */
export function isBundledFileStrict(source: Source): boolean {
  // If the file is NOT a JS file, trivially return false
  if (!isURLFileTypeJS(source.url)) {
    return false;
  }
  // If the file is TOO small, we trivially consider it NOT a bundle (even if actually Webpack is used) as it should not be a core part of SPA anyways.
  if (source.content.length < 1000) {
    return false;
  }
  // If .chunk or chunk. or .bundle/bundle. is present as part of the file, very likely it is a bundled file. (either a chunk or a full independent bundle)
  const pathSegments = source.url.split("/");
  const filename = pathSegments.length > 0 ? pathSegments[pathSegments.length-1] : ""; // length == 0 can happen when URL for some weird reason is missing.
  if (filename.includes(".chunk") || filename.includes("chunk.") || filename.includes(".bundle") || filename.includes("bundle.")) {
    return true;
  }
  // Most common bundle type is Webpack, so check if Webpack (webpackJsonp/webpackChunk) is ever mentioned
  // webpackJsonp example: https://reactjs.org/app-da93669150e5bde53c5c.js (url might change, but starts with "app")
  // webpackChunk example: https://webpack.js.org/vendor.bundle.js
  if (source.content.includes("webpackJsonp") || source.content.includes("webpackChunk")) {
    return true;
  }
  // If there are too many lines in the file, likely NOT a bundle.
  if (source.content.split("\n").length > 10) {
    return false;
  }

  const parseAttempt = parseBundleString(source.content);
  if (Object.keys(parseAttempt.modules).length > 0) {
    return true;
  }
  return false;
}

/**
 * WARNING: don't feed files created from sourceMaps into here.
 * @param {Source[]} sources 
 * @param {string} hostname Host's name, e.g. airbnb.com
 * @param {SpaDetectorOutput} output
 * @param {boolean=} requiresBundle Whether we assert that a page is an SPA only if a bundle is identifiable
 * @returns {boolean}
 */
export function isSPA(sources: Source[], hostname: string, output: SpaDetectorOutput, requiresBundle: boolean = false): boolean {
  /**
   * To decide if a site is SPA, heuristics:
   * 1. SPA framework search output is non-empty
   * 2. For each JS source (inline JS in HTML is unlikely for SPA, since it will block download and maybe block initial rendering, against SPA practice)
   */
  if (Object.getOwnPropertyNames(output).length <= 0) {
    return false;
  }
  // Retrieve identifier of host, usually the second level domain name.
  const hostnameSegments = hostname.split(".");
  const hostId = hostnameSegments.length >= 2 ? hostnameSegments[hostnameSegments.length-2] : "";
  for (const source of sources) {
    if (isURLFileTypeJS(source.url)) {
      // TODO: maybe consider enforcing same TLD/containing strings such as "cdn", "cache", or "static" (expect for "gstatic" etc.) in hostname to restrict scan to domain owned scripts (instead of other third party ones.)
      if (source.url.includes(hostId) // If the URL contains host identifier. Likely served from same domain/subdomain/CDN provider.
        || source.url.includes("cdn") /* For now, just only test these 2 criteria. Add more later on if found necessary. */) {
        if (!requiresBundle || isBundledFile(source)) {
          return true;
        }
      }
    }
  }
  return false;
}
