$( document ).ready(function() {

  asterank3d = new Asterank3D({
    container: $('#container'),
    run_asteroid_query: false,
    show_dat_gui: true
  });

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
