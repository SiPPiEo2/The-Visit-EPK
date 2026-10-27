/* THE VISIT EPK: behaviour (hero scroll, music player, video previews, nav highlight) */

/* Scroll-linked hero: THE and VISIT rise upward and fade */
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var words=document.querySelectorAll(".hero h1 span");
  var ticking=false, lastK=-1;
  function update(){
    var y=window.scrollY, vh=window.innerHeight;
    var k=Math.min(y/vh,1);
    if(k===1&&lastK===1){ ticking=false; return; }   /* hero is off screen: skip the work */
    lastK=k;
    if(words[0]) words[0].parentElement.style.opacity=1-k*0.9;
    words.forEach(function(w,i){
      var speed=i===0?30:20;   /* THE rises faster than VISIT */
      w.style.translate="0 "+(-k*speed)+"vh";
    });
    ticking=false;
  }
  addEventListener("scroll",function(){
    if(!ticking){ticking=true;requestAnimationFrame(update);}
  },{passive:true});
  addEventListener("resize",update);
  update();
})();

/* In-page player.
   - The normal Spotify embed (#spotifyFallback) always works and changes song on every Play.
   - The Spotify iFrame API controller loads in the background (#spotifyApi). Once it is ready it
     replaces the fallback, so Play can also start the song automatically. */
(function(){
  var box=document.getElementById("spotifyBox");
  var apiBox=document.getElementById("spotifyApi");
  var fallback=document.getElementById("spotifyFallback");
  var yt=document.getElementById("frame");
  var hint=document.getElementById("hint");
  var items=document.querySelectorAll(".tracks li");
  var tabs=document.querySelectorAll(".src button");
  var src="spotify", cur=items[0], ctrl=null, swapped=false;
  var wantPlay=false, paused=true, timer=null, createdUri=null;

  function uri(){ return "spotify:track:"+cur.dataset.spotify; }
  function embedUrl(){ return "https://open.spotify.com/embed/track/"+cur.dataset.spotify+"?theme=0"; }
  function setActive(){ items.forEach(function(li){li.classList.toggle("on",li===cur);}); }

  function startPlay(){
    if(!ctrl||!wantPlay) return;
    wantPlay=false; ctrl.play();
    clearTimeout(timer);
    timer=setTimeout(function(){ if(paused) hint.hidden=false; },2000);
  }
  function loadSpotify(play){
    hint.hidden=true;
    if(ctrl&&swapped){
      wantPlay=!!play;
      ctrl.loadUri(uri());
      if(play) setTimeout(startPlay,1200);   /* backup if the "ready" event does not fire */
    }else{
      wantPlay=!!play;                       /* if the API becomes ready a moment later, start playing then */
      fallback.src=embedUrl();               /* always changes the song */
    }
  }
  function loadYouTube(autoplay){
    yt.src="https://www.youtube-nocookie.com/embed/"+cur.dataset.yt+(autoplay?"?autoplay=1":"");
  }
  function showSource(){
    var sp=src==="spotify";
    box.hidden=!sp; yt.hidden=sp;
    if(sp){ yt.src="about:blank"; }
    else{
      if(ctrl&&swapped) ctrl.pause();
      else fallback.src="about:blank";       /* stop the fallback player's sound */
    }
  }

  items.forEach(function(li){
    li.querySelector(".play").addEventListener("click",function(){
      cur=li; setActive();
      if(src==="spotify") loadSpotify(true); else loadYouTube(true);
      (src==="spotify"?box:yt).scrollIntoView({behavior:"smooth",block:"nearest"});
    });
  });
  tabs.forEach(function(b){
    b.addEventListener("click",function(){
      src=b.dataset.src;
      tabs.forEach(function(x){x.setAttribute("aria-pressed",String(x===b));});
      showSource();
      if(src==="spotify") loadSpotify(false); else loadYouTube(false);
    });
  });
  setActive();

  /* Load Spotify's script only when needed (saves data on first visit) */
  var apiRequested=false;
  function loadSpotifyApi(){
    if(apiRequested) return; apiRequested=true;
    var s=document.createElement("script");
    s.src="https://open.spotify.com/embed/iframe-api/v1"; s.async=true;
    document.head.appendChild(s);
  }
  var music=document.getElementById("music");
  if("IntersectionObserver" in window && music){
    var apiIO=new IntersectionObserver(function(es){
      if(es[0].isIntersecting){ loadSpotifyApi(); apiIO.disconnect(); }
    },{rootMargin:"600px 0px"});
    apiIO.observe(music);
  }else{ loadSpotifyApi(); }
  items.forEach(function(li){ li.querySelector(".play").addEventListener("click",loadSpotifyApi); });

  /* Spotify calls this when its script has loaded */
  window.onSpotifyIframeApiReady=function(IFrameAPI){
    createdUri=uri();
    IFrameAPI.createController(document.getElementById("spotify-embed"),
      {uri:createdUri,width:"100%",height:152},
      function(c){
        ctrl=c;
        c.addListener("ready",function(){
          if(!swapped){
            swapped=true;                       /* first time the controller is really ready */
            apiBox.classList.remove("pending");
            fallback.hidden=true; fallback.src="about:blank";
            if(createdUri!==uri()){              /* user picked another song while it was loading */
              createdUri=uri(); c.loadUri(createdUri);
              return;                            /* the next "ready" event starts playback */
            }
          }
          startPlay();
        });
        c.addListener("playback_update",function(e){
          paused=e.data.isPaused;
          if(!paused){ hint.hidden=true; clearTimeout(timer); }
        });
      });
  };
})();

/* Video previews: show a thumbnail, load the YouTube player only when clicked */
document.querySelectorAll(".video").forEach(function(v){
  v.querySelector(".thumb").addEventListener("click",function(){
    var f=document.createElement("iframe");
    f.src="https://www.youtube-nocookie.com/embed/"+v.dataset.id+"?autoplay=1&rel=0";
    f.title=v.dataset.title+" video";
    f.allow="autoplay; encrypted-media; fullscreen; picture-in-picture";
    f.allowFullscreen=true;
    this.replaceWith(f);
  });
});

/* Nav: highlight the section currently in view */
(function(){
  var links=document.querySelectorAll(".site-nav a");
  var map={};
  links.forEach(function(a){ map[a.getAttribute("href").slice(1)]=a; });
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        links.forEach(function(a){a.classList.remove("active");});
        if(map[e.target.id]) map[e.target.id].classList.add("active");
      }
    });
  },{rootMargin:"-45% 0px -50% 0px"});
  Object.keys(map).forEach(function(id){
    var el=document.getElementById(id); if(el) io.observe(el);
  });
})();

/* About: switch the band story between English and Thai (remembers the choice) */
(function(){
  var about=document.getElementById("about");
  var text=about.querySelector(".bio-text");
  var btns=about.querySelectorAll(".lang button");
  function set(lang,save){
    text.dataset.lang=lang;
    btns.forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.lang===lang));});
    if(save){ try{localStorage.setItem("epk-lang",lang);}catch(e){} }
  }
  btns.forEach(function(b){b.addEventListener("click",function(){set(b.dataset.lang,true);});});
  var saved=null;
  try{saved=localStorage.getItem("epk-lang");}catch(e){}
  if(saved!=="th"&&saved!=="en") saved=/^th/i.test(navigator.language||"")?"th":"en";
  set(saved,false);
})();
