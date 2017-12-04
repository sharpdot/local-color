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
