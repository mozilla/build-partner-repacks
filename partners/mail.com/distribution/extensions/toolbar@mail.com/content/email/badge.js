const EXPORTED_SYMBOLS = [ "drawCount" ];

const minCountWidth = 16;
const countPadding = 1;
const separatorWidth = 2;
const iconWidth = 16;
const iconHeight = 16;

/* This function draws a red rectangle with a count on the passed toolbar button. */
/* The passed in image should be a locally created new Img
 * @param count Number to draw on in rectangle
 * @param button Button to draw the rectangle next to
 * @param image Image that will be used for the button
 */
function drawCount(count, button, image) {
  if (count == 0)
  {
    button.style.listStyleImage = "";
    return;
  }

  var canvas = button.ownerDocument.getElementById("united-count-canvas");
  if (!canvas)
  {
    canvas = button.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    canvas.setAttribute("id", "united-count-canvas");
    canvas.setAttribute("height", iconHeight);
  }
  var ctx = canvas.getContext("2d");
  /* Measure text and adjust canvas accordingly */
  var textMetrics = ctx.measureText(count);
  /* If the width of the text plus 2 for padding is over 16, grow the canvas */
  var countWidth;
  if (textMetrics.width + countPadding > minCountWidth) {
    canvas.setAttribute("width", iconWidth + separatorWidth + textMetrics.width + countPadding*2);
    countWidth = textMetrics.width + countPadding*2;
  } else {
    canvas.setAttribute("width", iconWidth + separatorWidth + minCountWidth);
    countWidth = minCountWidth;
  }
  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = "#F03D25"; // bright red
  ctx.fillRect(iconWidth + separatorWidth, 0, countWidth, iconHeight);
  ctx.font = "bold 10px Helvetica, sans-serif";
  ctx.fillStyle = "white";
  var xPos = iconWidth + separatorWidth + countPadding;
  /* If we did not grow the canvas, we need to center the text */
  if (countWidth == minCountWidth) {
    xPos = xPos + (countWidth - textMetrics.width)/2;
  }
  // Math can't be used to compute this value.
  // It's the position where the 10 pixels font looks best
  // centered vertically
  ctx.fillText(count, xPos, 12);
  var url = canvas.toDataURL();
  button.style.listStyleImage = "url('" + url + "')";

}
