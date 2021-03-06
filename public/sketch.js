var socket;
var i;

$(document).ready(function(){

  // create the checkbox elements
  for (i = 0; i < 2480; i++) {
    $('#main').append('<div><input class="checkbox checkbox'+i+'" type="checkbox"></input></div>')
  }

  socket = io.connect('http://v9373939.campusvps.de:3000');
  // socket = io.connect('localhost:3000');

  // 4) on receiving data on mouse make new Drawing
  socket.on('mouse', check);

  // toggle the checkboxes on click and save it to data
  $( ".checkbox" ).each(function( index ) {
    $(document).on('click', '.checkbox'+index+'', function(){
      if($('.checkbox'+index+'').is(':checked')) {
        var data = {
          x: true,
          y: index
        }
      } else {
        var data = {
          x: false,
          y: index
        }
      }
      // 1) name the message and attach data to it, this sends the stuff
      socket.emit('mouse', data);
    });
  });

  function check(data){
    // on receiving check or uncheck the checkbox
    $('.checkbox'+data.y+'').prop('checked', data.x);
  }

});
