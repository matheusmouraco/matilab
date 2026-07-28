(function(){
  "use strict";
  var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse=matchMedia("(pointer: coarse)").matches;

  /* -------- hero flow field (cobalt hairlines on paper) -------- */
  function initFlow(){
    var cv=document.getElementById("flow"); if(!cv||reduce) return;
    var ctx=cv.getContext("2d"); if(!ctx) return;
    var dpr=Math.min(devicePixelRatio||1,1.5), W=0,H=0, host=cv.parentElement;
    function size(){W=host.clientWidth;H=host.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+"px";cv.style.height=H+"px";ctx.setTransform(dpr,0,0,dpr,0,0);}
    addEventListener("resize",size,{passive:true}); size();
    var N=coarse?70:150, parts=[], mx=-999,my=-999;
    for(var i=0;i<N;i++)parts.push({x:Math.random()*W,y:Math.random()*H,px:0,py:0,s:.3+Math.random()*.7});
    host.addEventListener("mousemove",function(e){var r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;});
    host.addEventListener("mouseleave",function(){mx=-999;my=-999;});
    function flow(x,y,t){return Math.sin(x*0.0016+t)*1.4 + Math.cos(y*0.0016 - t*0.7)*1.4;}
    var t=0, run=true;
    document.addEventListener("visibilitychange",function(){run=!document.hidden; if(run)requestAnimationFrame(step);});
    function step(){
      if(!run)return;
      t+=0.0016;
      ctx.fillStyle="rgba(231,228,219,0.045)"; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle="rgba(46,27,255,0.16)"; ctx.lineWidth=1;
      for(var i=0;i<N;i++){var p=parts[i];p.px=p.x;p.py=p.y;
        var a=flow(p.x,p.y,t);
        var dx=p.x-mx,dy=p.y-my,d2=dx*dx+dy*dy;
        if(d2<26000){var d=Math.sqrt(d2)||1;p.x+=dx/d*1.6;p.y+=dy/d*1.6;}
        p.x+=Math.cos(a)*p.s*1.5; p.y+=Math.sin(a)*p.s*1.5;
        if(p.x<0||p.x>W||p.y<0||p.y>H){p.x=Math.random()*W;p.y=Math.random()*H;p.px=p.x;p.py=p.y;}
        ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(p.x,p.y);ctx.stroke();
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* -------- preloader -------- */
  function initPre(){
    var pre=document.getElementById("pre"),n=document.getElementById("preN"),bar=document.getElementById("preBar"),hero=document.getElementById("hero");
    function go(){document.body.classList.remove("lock"); if(hero)hero.classList.add("in");}
    if(!pre){go();return;}
    var dur=reduce?200:1600,t0=null;
    function step(ts){if(t0===null)t0=ts;var k=Math.min((ts-t0)/dur,1),e=1-Math.pow(1-k,3);
      if(n)n.textContent=Math.floor(e*100); if(bar)bar.style.width=(e*100)+"%";
      if(k<1)requestAnimationFrame(step);
      else setTimeout(function(){pre.classList.add("done");go();setTimeout(function(){pre.style.display="none";},1050);},reduce?0:220);}
    requestAnimationFrame(step);
  }

  /* -------- cursor -------- */
  function initCursor(){
    if(coarse)return;
    var dot=document.querySelector(".cur"),ring=document.querySelector(".cur-r"),lbl=ring.querySelector(".l");
    var x=innerWidth/2,y=innerHeight/2,rx=x,ry=y;
    addEventListener("mousemove",function(e){x=e.clientX;y=e.clientY;dot.style.transform="translate3d("+(x-4)+"px,"+(y-4)+"px,0)";},{passive:true});
    (function loop(){rx+=(x-rx)*.2;ry+=(y-ry)*.2;ring.style.transform="translate3d("+(rx-20)+"px,"+(ry-20)+"px,0)";requestAnimationFrame(loop);})();
    document.querySelectorAll("a,button,[data-cursor],.drow,.proj").forEach(function(el){
      el.addEventListener("mouseenter",function(){ring.classList.add("hov");var t=el.getAttribute("data-cursor");if(t){ring.classList.add("lab");lbl.textContent=t;}});
      el.addEventListener("mouseleave",function(){ring.classList.remove("hov","lab");lbl.textContent="";});
    });
    document.addEventListener("mouseleave",function(){dot.style.opacity=0;ring.style.opacity=0;});
    document.addEventListener("mouseenter",function(){dot.style.opacity=1;ring.style.opacity=1;});
  }

  /* -------- magnetic -------- */
  function initMag(){
    if(coarse)return;
    document.querySelectorAll(".nav__cta,.cta__mail,.hero__scroll .a,.work__all a").forEach(function(el){
      var s=el.classList.contains("cta__mail")?.22:.4;
      el.addEventListener("mousemove",function(e){var r=el.getBoundingClientRect();var dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
        el.style.transition="transform .1s linear";el.style.transform="translate("+dx*s+"px,"+dy*s+"px)";});
      el.addEventListener("mouseleave",function(){el.style.transition="transform .6s cubic-bezier(.19,1,.22,1)";el.style.transform="";});
    });
  }

  /* -------- reveals -------- */
  function initReveal(){
    var els=document.querySelectorAll(".rv,.rl,.step,.proj");
    if(!("IntersectionObserver" in window)){els.forEach(function(e){e.classList.add("in");});return;}
    var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target);
      if(x.target.classList.contains("stat"))count(x.target);}});},{threshold:.14,rootMargin:"0px 0px -8% 0px"});
    els.forEach(function(e){io.observe(e);});
    document.querySelectorAll(".stat").forEach(function(e){io.observe(e);});
  }
  function count(stat){var b=stat.querySelector("b[data-count]");if(!b)return;var tg=parseInt(b.getAttribute("data-count"),10),sf=b.getAttribute("data-suffix")||"",s=null;
    function r(ts){if(s===null)s=ts;var k=Math.min((ts-s)/1300,1),e=1-Math.pow(1-k,3);b.textContent=Math.floor(e*tg)+sf;if(k<1)requestAnimationFrame(r);else b.textContent=tg+sf;}requestAnimationFrame(r);}

  /* -------- kinetic type + image parallax (scroll velocity) -------- */
  function initKinetic(){
    if(reduce)return;
    var kins=[].slice.call(document.querySelectorAll(".kin"));
    var imgs=[].slice.call(document.querySelectorAll(".proj__img"));
    var lastY=scrollY,vel=0,dispW=300;
    addEventListener("scroll",function(){var y=scrollY;var dv=y-lastY;lastY=y;vel=vel*0.6+dv*0.4;},{passive:true});
    function loop(){
      vel*=0.9;
      var av=Math.min(Math.abs(vel),60);
      var w=300+av*7; if(w>800)w=800;
      dispW+=(w-dispW)*0.12;
      var stretch=1+Math.min(av,50)/900;
      kins.forEach(function(el){el.style.fontVariationSettings='"wght" '+dispW.toFixed(0);el.style.transform='scaleY('+stretch.toFixed(3)+')';el.style.transformOrigin='bottom left';});
      var vh=innerHeight;
      for(var i=0;i<imgs.length;i++){var im=imgs[i],r=im.getBoundingClientRect();
        if(r.bottom<-200||r.top>vh+200)continue;
        if(im.parentElement && im.parentElement.parentElement && im.parentElement.parentElement.matches(":hover"))continue;
        var prog=(r.top+r.height/2 - vh/2)/vh;
        im.style.transform='translateY('+(prog*-6).toFixed(2)+'%) scale(1.04)';
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* -------- menu / nav autohide -------- */
  function initMenu(){var b=document.getElementById("burger"),m=document.getElementById("menu");if(!b)return;
    b.addEventListener("click",function(){var o=m.classList.toggle("open");document.body.classList.toggle("lock",o);b.setAttribute("aria-label",o?"Fechar menu":"Abrir menu");});
    m.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){m.classList.remove("open");document.body.classList.remove("lock");});});}
  function initNav(){var nav=document.getElementById("nav"),last=0;addEventListener("scroll",function(){var y=scrollY;
    if(y>last&&y>240)nav.style.transform="translateY(-130%)";else nav.style.transform="translateY(0)";last=y;},{passive:true});}

  document.getElementById("yr").textContent=new Date().getFullYear();
  initFlow();initPre();initCursor();initMag();initReveal();initKinetic();initMenu();initNav();
})();
/* ==================== page transitions (multi-page) ==================== */
(function(){
  "use strict";
  var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pt=document.getElementById("pt");
  if(!pt) return;
  var hasPre=!!document.getElementById("pre");
  // entrance: pages without preloader lift the curtain
  if(!hasPre && !reduce){
    pt.classList.add("in");
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      pt.classList.remove("in");pt.classList.add("out");
      setTimeout(function(){pt.classList.remove("out");pt.style.transform="translateY(100%)";},760);
    });});
  }
  // exit: intercept internal .html links
  function internal(a){
    if(!a) return false;
    var href=a.getAttribute("href")||"";
    if(a.target==="_blank"||a.hasAttribute("download")) return false;
    if(href.indexOf("#")===0||href.indexOf("mailto:")===0||href.indexOf("tel:")===0||href.indexOf("http")===0) return false;
    return /\.html($|\?)/.test(href)||href===""||href==="./"||href==="/";
  }
  document.addEventListener("click",function(e){
    if(reduce) return;
    var a=e.target.closest("a"); if(!internal(a)) return;
    var url=a.getAttribute("href"); if(!url) return;
    e.preventDefault();
    pt.style.transform=""; pt.classList.remove("out"); pt.classList.add("in");
    setTimeout(function(){window.location.href=url;},560);
  });
  window.addEventListener("pageshow",function(ev){ if(ev.persisted){pt.classList.remove("in","out");pt.style.transform="translateY(100%)";} });
})();
