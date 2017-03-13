$(document).ready(function() {
  var currentDate = new Date;
  var currentTime = currentDate.getHours() + 1;
  $('#time').val(currentTime + ':00');
});
