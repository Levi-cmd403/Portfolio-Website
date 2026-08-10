document.addEventListener('DOMContentLoaded', function(){
  var yearEls = document.querySelectorAll('#year');
  yearEls.forEach(function(el){
    el.textContent = new Date().getFullYear();
  });

  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');

  if(navToggle && mainNav){
    navToggle.addEventListener('click', function(){
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      mainNav.classList.toggle('is-open');
    });
  }

  var heroGraphic = document.querySelector('.hero-graphic');
  var artifact = document.querySelector('.artifact');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(heroGraphic && artifact && !reduceMotion){
    var motion = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: false,
      frame: null,
    };

    var resetBubble = function(){
      motion.targetX = 0;
      motion.targetY = 0;
      motion.active = false;
      heroGraphic.classList.remove('is-bending');
      heroGraphic.style.setProperty('--bubble-scale-x', '1');
      heroGraphic.style.setProperty('--bubble-scale-y', '1');
      heroGraphic.style.setProperty('--bubble-tilt', '0deg');
      heroGraphic.style.setProperty('--bubble-skew-x', '0deg');
      heroGraphic.style.setProperty('--bubble-skew-y', '0deg');
      heroGraphic.style.setProperty('--bubble-inner-x', '0px');
      heroGraphic.style.setProperty('--bubble-inner-y', '0px');
      heroGraphic.style.setProperty('--bubble-ring-scale', '1');
      heroGraphic.style.setProperty('--bubble-ring-rotate', '18deg');
      heroGraphic.style.setProperty('--bubble-highlight-x', '0%');
      heroGraphic.style.setProperty('--bubble-highlight-y', '0%');
      heroGraphic.style.setProperty('--bubble-shadow-x', '0%');
      heroGraphic.style.setProperty('--bubble-shadow-y', '0%');
      heroGraphic.style.setProperty('--bubble-gloss-x', '0%');
      heroGraphic.style.setProperty('--bubble-gloss-y', '0%');
      heroGraphic.style.setProperty('--bubble-refract-x', '0deg');
      heroGraphic.style.setProperty('--bubble-refract-y', '0deg');
      heroGraphic.style.setProperty('--bubble-caustic-x', '0%');
      heroGraphic.style.setProperty('--bubble-caustic-y', '0%');
      if(!motion.frame){
        motion.frame = window.requestAnimationFrame(tickBubble);
      }
    };

    var updateBubble = function(event){
      var rect = heroGraphic.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width;
      var y = (event.clientY - rect.top) / rect.height;
      var dx = (x - 0.5) * 2;
      var dy = (y - 0.5) * 2;
      var distance = Math.min(1, Math.sqrt(dx * dx + dy * dy));

      motion.active = true;
      motion.targetX = dx * 12;
      motion.targetY = dy * 12;
      heroGraphic.classList.add('is-bending');

      if(!motion.frame){
        motion.frame = window.requestAnimationFrame(tickBubble);
      }

      heroGraphic.style.setProperty('--bubble-scale-x', (1 + Math.abs(dx) * 0.08).toFixed(3));
      heroGraphic.style.setProperty('--bubble-scale-y', (1 + Math.abs(dy) * 0.08).toFixed(3));
      heroGraphic.style.setProperty('--bubble-ring-scale', (1 + distance * 0.06).toFixed(3));
    };

    var tickBubble = function(){
      motion.x += (motion.targetX - motion.x) * 0.14;
      motion.y += (motion.targetY - motion.y) * 0.14;

      var pullX = motion.x / 12;
      var pullY = motion.y / 12;
      var distance = Math.min(1, Math.sqrt(pullX * pullX + pullY * pullY));

      heroGraphic.style.setProperty('--bubble-shift-x', motion.x.toFixed(2) + 'px');
      heroGraphic.style.setProperty('--bubble-shift-y', motion.y.toFixed(2) + 'px');
      heroGraphic.style.setProperty('--bubble-tilt', (pullX * 8).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-skew-x', (pullX * 5).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-skew-y', (-pullY * 4).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-inner-x', (-pullX * 10).toFixed(2) + 'px');
      heroGraphic.style.setProperty('--bubble-inner-y', (-pullY * 10).toFixed(2) + 'px');
      heroGraphic.style.setProperty('--bubble-ring-rotate', (18 + pullX * 10).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-highlight-x', (pullX * 8).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-highlight-y', (pullY * 8).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-shadow-x', (-pullX * 10).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-shadow-y', (-pullY * 10).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-gloss-x', (pullX * 4).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-gloss-y', (pullY * 4).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-refract-x', (pullX * 18).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-refract-y', (pullY * 12).toFixed(2) + 'deg');
      heroGraphic.style.setProperty('--bubble-caustic-x', (pullX * 6).toFixed(2) + '%');
      heroGraphic.style.setProperty('--bubble-caustic-y', (pullY * 6).toFixed(2) + '%');

      if(!motion.active && Math.abs(motion.x) < 0.02 && Math.abs(motion.y) < 0.02){
        motion.x = 0;
        motion.y = 0;
        heroGraphic.style.setProperty('--bubble-shift-x', '0px');
        heroGraphic.style.setProperty('--bubble-shift-y', '0px');
        heroGraphic.style.setProperty('--bubble-scale-x', '1');
        heroGraphic.style.setProperty('--bubble-scale-y', '1');
        heroGraphic.style.setProperty('--bubble-tilt', '0deg');
        heroGraphic.style.setProperty('--bubble-skew-x', '0deg');
        heroGraphic.style.setProperty('--bubble-skew-y', '0deg');
        heroGraphic.style.setProperty('--bubble-inner-x', '0px');
        heroGraphic.style.setProperty('--bubble-inner-y', '0px');
        heroGraphic.style.setProperty('--bubble-ring-scale', '1');
        heroGraphic.style.setProperty('--bubble-ring-rotate', '18deg');
        heroGraphic.style.setProperty('--bubble-highlight-x', '0%');
        heroGraphic.style.setProperty('--bubble-highlight-y', '0%');
        heroGraphic.style.setProperty('--bubble-shadow-x', '0%');
        heroGraphic.style.setProperty('--bubble-shadow-y', '0%');
        heroGraphic.style.setProperty('--bubble-gloss-x', '0%');
        heroGraphic.style.setProperty('--bubble-gloss-y', '0%');
        motion.frame = null;
        return;
      }

      motion.frame = window.requestAnimationFrame(tickBubble);
    };

    heroGraphic.addEventListener('pointermove', updateBubble);
    heroGraphic.addEventListener('pointerenter', updateBubble);
    heroGraphic.addEventListener('pointerleave', resetBubble);
    resetBubble();
  }
});