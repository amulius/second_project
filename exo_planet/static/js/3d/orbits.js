$( document ).ready(function() {
    console.log(window.location.pathname.split('/').slice(2)[0]);
    var system = window.location.pathname.split('/').slice(2)[0];
  var oribts = new Asterank3D({
    container: $('#container'),
    show_dat_gui: true,
    want: system
  });

  oribts.processAsteroidRankings();

  // Other wiring
  $('#hide_sidebar').on('click', function() {
    $('#sidebar').hide();
    $('#show_sidebar_container').show();
  });
  $('#show_sidebar').on('click', function() {
    $('#sidebar').show();
    $('#show_sidebar_container').hide();
  });
});
