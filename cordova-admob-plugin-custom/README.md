# install:
cordova plugin add ./cordova-admob-plugin-custom

# show sample Interstitial:
```
<button id="'btnShowAd">Show Ad Interstitial</button>
<script>
document.addEventListener('deviceready', function() {
    if(window.cordova) {
        const btn = document.getElementById('btnShowAd');
        btn.addEventListener('click', function() {
            AdMobPluginCustom.showInterstitial(
                function(successMsg) {
                    console.log("Sukces: ", successMsg);
                },
                function(errorMsg) {
                    console.error("Error: ", errorMsg);
                }
            );
        });
    }
}, false);
</script>
```
