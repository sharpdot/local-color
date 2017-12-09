// Home
console.log('app started');
// init search form
$('.searchForm').submit(function onSearchSubmit(evt){
  evt.preventDefault()
  var term = $(this).find('input[type="text"]').first().val()
  if (term != ''){
    var url = $(this).prop('action') + '/' + term
    document.location = url
    return
  }
  alert('Please enter a search term')
})

$('.result-row .result-json-data').each(function(idx, item){
  var $p = $(this),
    json = $p.data('json'),
    colors = json.colors
  if (json.colors){
    //console.log('json colors for this row...',colors)
    var colorsHtml = json.colors.map(function(obj) {
      return '<span class="color-box" style="background-color:rgba(' + obj.join(',') + ', 1);">' + obj.join('<br />') + '</span>'
    })
    $p.html(colorsHtml)
  }
})
