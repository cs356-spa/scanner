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
  const angular2VersionRegex = /ng\-version=['"]([0-9\.]+)['"]/;
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
  const reactDataRegex1 = /data\-reactid/; // only occurs before React 15, see https://stackoverflow.com/questions/17585787/whats-data-reactid-attribute-in-html
  const reactDataRegex2 = /data\-reactroot/; // similar as before. https://github.com/kentcdodds/react-detector/blob/master/content-script.js
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
  // Lifecycle names
  "componentDidMount", "componentWillMount",
  // Hooks
  "useState", "useEffect",
  // Secret internals
  "DO_NOT_USE_OR_YOU_WILL_BE_FIRED",
  // Likely will work in a way similar to that devtools (part of the renderer details). Example: https://webpack.js.org/vendor.bundle.js
  "rendererPackageName"
  // TODO: find more possible identifiers based on older versions of React bundles.
];
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
  let reactVersionResult;
  while ((reactVersionResult = reactVersionRegex.exec(content)) !== null) {
    const version = reactVersionResult[0].replace(/["'`]/g, ""); // drop wrapping quotes. I could have used lookahead/lookbehind but unsure about lookbehind support in JS yet.
    const contextSubstringFromContent = content.substring(reactVersionResult.index-CONTEXT_LOOKAROUND_OFFSET, reactVersionResult.index+CONTEXT_LOOKAROUND_OFFSET);
    for (const lookAlikeId of REACT_LOOKALIKE_IDS) {
      if (contextSubstringFromContent.toLowerCase().includes(lookAlikeId.toLowerCase())) { // Somehow for whatever reason context string is actually lowercase...
        mergeOutput(output, "react", {
          version,
          reasonURL: fileURL,
          confidence: ConfidenceLevel.MEDIUM, // We are less sure about this.
          isStatic: true,
        });
        break;
      }
    }
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
