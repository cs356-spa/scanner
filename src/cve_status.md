### Some interesting CVEs of libraries we can briefly discuss on

+ React
  + CVE-2018-6341: https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-6341
    + React applications which rendered to HTML using the ReactDOMServer API were not escaping user-supplied attribute names at render-time. That lack of escaping could lead to a cross-site scripting vulnerability. This issue affected minor releases 16.0.x, 16.1.x, 16.2.x, 16.3.x, and 16.4.x. It was fixed in 16.0.1, 16.1.2, 16.2.1, 16.3.3, and 16.4.2.
    + Blog post: https://reactjs.org/blog/2018/08/01/react-v-16-4-2.html
      + Vue and Svelte might have similar issues: https://github.com/vuejs/vue/commit/c28f79290d57240c607d8cec3b3413b49702e1fb
        + Vue coordinated tweet: https://twitter.com/vuejs/status/1024754536877973504
    + From sample run, there are actually sites using 16.2.0, which is a vulnerable version
      + Would be interesting to know which site is like this.
+ Angular.js
  + CVE-2020-7676: https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2020-7676
    + angular.js prior to 1.8.0 allows cross site scripting. The regex-based input HTML replacement may turn sanitized code into unsanitized one. Wrapping `<option>` elements in `<select>` ones changes parsing behavior, leading to possibly unsanitizing code.
    + Github fix: https://github.com/angular/angular.js/pull/17028
  + CVE-2019-14863: https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-14863
    + There is a vulnerability in all angular versions before 1.5.0-beta.0, where after escaping the context of the web application, the web application delivers data to its users along with other trusted dynamic content, without validating it.
    + Snyk report: https://snyk.io/vuln/npm:angular:20150807
      + Github fix: https://github.com/angular/angular.js/pull/12524


+ Samples from other packages
  + Moment.js
    + DoS exploit vector:
      + Before 2.15.2
      + Why: https://gist.github.com/grnd/50192ce22681848a7de812d95241b7fc
      + Fix: https://github.com/moment/moment/commit/663f33e333212b3800b63592cd8e237ac8fabdb9



+ Other useful vulnerability DB
  + Snyk: https://snyk.io/vuln