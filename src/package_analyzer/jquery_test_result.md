# Evaluation of string-based package crawler effectiveness

Seems good enough, though only have a detection rate of 50%. (But still a good amount for analysis)

Actual versions retrieved using dynamic eval:
```js
{
  'http://goo.gl': '1.11.3',
  'http://player.vimeo.com': '2.1.1',
  'http://tumblr.com': '2.2.4',
  'http://go.microsoft.com': '3.3.1',
  'http://microsoft.com': '3.3.1',
  'http://gravatar.com': '1.11.0',
  'http://europa.eu': '1.11.1',
  'http://wordpress.com': '1.12.4',
  'http://bit.ly': '1.12.4',
  'http://nih.gov': '1.8.3',
  'http://mozilla.org': '3.4.1',
  'http://wordpress.org': '1.12.4',
  'http://qq.com': '1.11.1',
  'http://apache.org': '2.1.1',
  'http://amazonaws.com': '3.4.1',
  'http://support.microsoft.com': '1.9.1',
  'http://www.ncbi.nlm.nih.gov': '2.1.4',
  'http://archive.org': '1.10.2',
  'http://creativecommons.org': '1.12.4',
  'http://who.int': '1.12.1',
  'http://cloudflare.com': '3.4.1',
  'http://reuters.com': '2.2.4',
  'http://tinyurl.com': '1.11.0',
  'http://msn.com': '2.1.1',
  'http://oracle.com': '3.5.1',
  'http://wp.com': '1.12.4',
  'http://weebly.com': '2.1.4',
  'http://php.net': '1.10.2',
  'http://spotify.com': '2.1.3'
}
```

Expected version extracted by our string-based package analyzer:
```js
{
  jquery: {
    '1.11.2': Map {
      'goo.gl' => Set {
        'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js'
      },
      'wordpress.com' => Set {
        'https://s1.wp.com/home.logged-out/page-jan-2020-v2/js/bundle.js?v=1602584339'
      },
      'bit.ly' => Set {
        'https://docrdsfx76ssb.cloudfront.net/static/1603899179/pages/wp-content/uploads/cache/fvm/1603899166/out/footer-155c5e534c04a81f2d6c0a6a3142208b5ec7c4e1.min.js'
      },
      'wordpress.org' => Set {
        'https://s.w.org/wp-includes/js/jquery/jquery.js?v=1.11.1'
      },
      'wp.com' => Set {
        'https://s1.wp.com/home.logged-out/page-jan-2020-v2/js/bundle.js?v=1602584339'
      }
    },
    '1.11.0': Map {
      'gravatar.com' => Set { 'https://s.gravatar.com/js/jquery.js?136' },
      'archive.org' => Set {
        'https://archive.org/includes/jquery-1.10.2.min.js?v1.10.2'
      }
    },
    '1.11.1': Map {
      'europa.eu' => Set {
        'https://europa.eu/wel/eu_portal/2014/scripts/libs/jquery.js'
      }
    },
    '1.8.2': Map {
      'nih.gov' => Set {
        'https://www.nih.gov/sites/default/files/js/js_6DQs8KEe_-iFp_LRuwf9H6Bkm9v9NRbBOVS5rj2_tmA.js'
      },
      'support.microsoft.com' => Set {
        'https://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.9.1.min.js'
      }
    },
    '2.1.2': Map {
      'soundcloud.com' => Set { 'https://a-v2.sndcdn.com/assets/1-eaee80b4-3.js' },
      'www.ncbi.nlm.nih.gov' => Set {
        'https://www.ncbi.nlm.nih.gov/core/jig/1.14.8/js/jig.min.js'
      }
    },
    '2.1.1': Map {
      'apache.org' => Set { 'http://apache.org/js/jquery-2.1.1.min.js' }
    },
    '3.0.0': Map {
      'cloudflare.com' => Set {
        'https://assets.www.cloudflare.com/js/chunk-0610a6f5d93ab577eb30.js'
      }
    },
    '3.5.0': Map {
      'oracle.com' => Set { 'https://www.oracle.com/asset/web/js/jquery-min.js' }
    }
  }
}
```

Comparison (by design of analyzer, it provides a lower bound of most likely package version - should be smaller than the actual):
```js
// actual => predicted
{
  'http://goo.gl': '1.11.3' => '1.11.2',
  'http://player.vimeo.com': '2.1.1' => null,
  'http://tumblr.com': '2.2.4' => null,
  'http://go.microsoft.com': '3.3.1' => null,
  'http://microsoft.com': '3.3.1' => null,
  'http://gravatar.com': '1.11.0' => '1.11.0',
  'http://europa.eu': '1.11.1' => '1.11.1',
  'http://wordpress.com': '1.12.4' => '1.11.2',
  'http://bit.ly': '1.12.4' => '1.11.2',
  'http://nih.gov': '1.8.3' => '1.8.2',
  'http://mozilla.org': '3.4.1' => null,
  'http://wordpress.org': '1.12.4' => '1.11.2',
  'http://qq.com': '1.11.1' => null,
  'http://apache.org': '2.1.1' => '2.1.1',
  'http://amazonaws.com': '3.4.1' => null,
  'http://support.microsoft.com': '1.9.1' => '1.8.2',
  'http://www.ncbi.nlm.nih.gov': '2.1.4' => '2.1.2',
  'http://archive.org': '1.10.2' => '1.11.0',
  'http://creativecommons.org': '1.12.4',
  'http://who.int': '1.12.1' => null,
  'http://cloudflare.com': '3.4.1' => '3.0.0',
  'http://reuters.com': '2.2.4' => null,
  'http://tinyurl.com': '1.11.0' => null,
  'http://msn.com': '2.1.1' => null,
  'http://oracle.com': '3.5.1' => '3.5.0',
  'http://wp.com': '1.12.4' => '1.11.2',
  'http://weebly.com': '2.1.4' => null,
  'http://php.net': '1.10.2' => null,
  'http://spotify.com': '2.1.3' => null
}

// Found by static analysis but NOT by dynamic eval
// Manual investigation shows soundcloud ACTUALLY used jQuery! (has a variable called jQuery2240458568088659002451)
[
  'soundcloud.com',
]
```
