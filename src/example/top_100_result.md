# Result of Running SPA detector on top 1000 sites:

```
# Out of 1000 sites, only 963 could be connected under headless mode.
# On 100~200 sites, we are unable to run `page.content()` to get the fully rendered HTML result. This would likely result in less angular results being reported.
# This also affects detection of Vue versions. We need to probably also develop static alternatives for some.
# We will also need to write some scripts that collects failed domains and investigate why.
# One example is www.washingtonpost.com, which occasionally (not always, which is mysterious) would have an error reported during evaluation. (see comments in crawler.ts)
# Another interesting behavior observed is that washingtonpost.com also loads different amount of resources (under headless, WAY more resources) under headless/full rendering modes. This can present a data skew: some sites might employ fingerprinting to detect if the page is visited by a real person to avoid sabotage.

# Count of total detected frameworks
{ react: 162, angular: 2, angularjs: 15, vue: 14 }
# Version detection result. Notice some numbers are obviously off (e.g. 0.0.1 and 0.8.2 does not seem correct)
{
  react: Map {
    '16.14.0' => 9,
    '16.12.0' => 13,
    '16.5.2' => 1,
    '16.13.1' => 52,
    '16.13.0' => 4,
    '16.11.0' => 4,
    '16.10.2' => 4,
    '16.7.0' => 4,
    '16.8.6' => 17,
    '17.0.0-alpha.0-c59c3dfe5' => 6,
    '16.8.0' => 4,
    '16.0.0' => 1,
    '16.4.0' => 1,
    '16.3.2' => 1,
    '0.13.3' => 3,
    '16.9.0' => 13,
    '0.0.1' => 1,
    '0.8.2' => 1,
    '16.2.0' => 1,
    '16.8.3' => 1,
    '16.6.1' => 1,
    '15.4.0' => 1,
    '16.3.0' => 1
  },
  angular: Map { '4' => 1, '9.0.4' => 1 },
  angularjs: Map {
    '1.6.4' => 3,
    '1.4.3' => 1,
    '1.6.6' => 1,
    '1.5.8' => 3,
    '1.8.0' => 1,
    '1.7.7' => 1,
    '1.7.9' => 1,
    '1.5.9' => 1,
    '1.2.17' => 1,
    '1.2.28' => 1,
    '1.6.9' => 1
  },
  vue: Map { '2.6.10' => 3, '2.5.21' => 1 }
}
```