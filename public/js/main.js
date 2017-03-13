$(document).ready(function() {
  var currentDate = new Date();
  var currentTime = currentDate.getHours() + 1;
  if (currentTime <= 9) {
    currentTime = "0" + currentTime;
  }
  $('#time').val(currentTime + ':00');
});
