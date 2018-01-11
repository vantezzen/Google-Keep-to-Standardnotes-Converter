// Final array of converted items
let converted = {
  "items": []
};

// Regex to get the date string out of the note
let dateregex = /<div class="meta-icons">(\n){0,}(.){0,}(\n){0,}<\/div>\n.*?(?=<\/div>)/g;
let dateregex2 = /\n[^<\n].*/g;
let dateregex3 = /[\d\w\.\ \,\:]{1,}/g;

// Number of converted notes
let num_converted = 0;
// Number of notes that need to be converted
let should_convert = 0;
// Interval that checks if all notes have been converted
let check_interval = 0;


///// HELPING FUNCTIONS /////
// SOURCE: https://stackoverflow.com/a/2117523
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// SOURCE: https://stackoverflow.com/a/30832210
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

// Error listener
window.addEventListener("error", function (e) {
   console.log(e);
   if (window.isConverting !== true) {
     return false;
   }
   if (!$('#err').html()) {
     $('#err').html('There were errors while converting your notes. You archive may be still valid.<br />');
   }
   $('#err').append(e.message + ' (see console for more information)<br />');
   return false;
})

// Main function to start converting
function convert() {
  window.isConverting = true;

  // Get selected files
  var files = document.getElementById('files').files;

  // Set number of files that need to be converted
  should_convert = files.length;

  // Change button
  $('#convert-btn').html('Converting... (0/' + should_convert + ')').prop('disabled', true);

  // Reset final array
  converted = {
    "items": []
  };

  // Only proceed if there are selected files
  if (files) {
    // Loop through selected files
    for (var i = 0, f; f = files[i]; i++) {
      // Only proceed if selected file is *.html
      if (!f.type.match('text/html')) {
        alert(f.name + " is not a valid note\n");
        continue;
      }
      // Read file
      var r = new FileReader();
      r.onload = (function(f) {
        return function(e) {
          var contents = e.target.result;

          // Pass file to convertFile funtion
          convertFile(contents, f.name);
        };
      })(f);

      r.readAsText(f);
    }
    // Check if all notes have been converted yet
    check_interval = setInterval(function() {
      if (num_converted >= should_convert) {
        download(JSON.stringify(converted), "standardnotes-archive.txt", 'text/plain');
        clearInterval(check_interval);
        $('#note').html('');
        $('#convert-btn').html('Done!').prop('disabled', false);
        window.isConverting = false;
      } else {
        $('#convert-btn').html('Converting... (' + num_converted + '/' + should_convert + ')').prop('disabled', true);
      }
    }, 1);
  } else {
    // Alert if not selected files have been found
    alert("Failed to load files");
  }
}

// Convert a note
function convertFile(content, name) {
  // Copy note content to #note so that we can get elements of it
  $('#note').html(content);
  // Remove any css
  $('#note').find('style').html('');

  // Get title
  var title = $('#note').find('title').html();

  // Get date the note has been created
  var date = content.match(dateregex)[0];
  date = date.match(dateregex2)[0];
  date = date.match(dateregex3)[0];

  // Try to parse date using javascript date parser
  var created = new Date(date);

  // Check if parsing wasn't successful
  if (isNaN(created)) {
    // Trying to get date trough manual regex
    var year = date.match(/\d{4}/g)[0];
    var day = date.match(/^\d{2}/g)[0];
    var month = date.match(/\d{2}(?=\.)/g)[1];
    var hour = date.match(/\d{2}(?=\:\d{2}\:\d{2})/g)[0];
    var min = date.match(/\d{2}(?=\:\d{2})/g)[1];
    var sec = date.match(/\d{2}$/g)[0];

    created = new Date(year, month, day, hour, min, sec);
  }

  // Format the date into the needed format
  var created = formatDate(created);

  // If the title is the date there is no title
  if (title == date) {
    title = "";
  }

  // Get note content
  var note = $('#note').find('.content').html();
  note = note.replace(new RegExp("<br>", 'g'), "\n");

  // Create item
  var item = {};
  item.created_at = created;
  item.updated_at = created;
  item.uuid = uuidv4();
  item.content_type = "Note";
  item.content = {};
  item.content.title = title;
  item.content.text = note;
  item.content.references = [];

  // Push item to final array
  converted.items.push(item);

  // Add to number of converted ntoes
  num_converted++;
}

// Format a date object into the needed format for a Standardnotes archive
function formatDate(date) {
  var final = "";
  final += date.getFullYear();
  final += "-";
  final += toTwoDigit(date.getMonth());
  final += "-";
  final += toTwoDigit(date.getDate());
  final += "T";
  final += toTwoDigit(date.getHours());
  final += ":";
  final += toTwoDigit(date.getMinutes());
  final += ":";
  final += toTwoDigit(date.getSeconds());
  final += ".000Z";
  return final;
}

// Convert a number into a two digit one (1 => 01)
function toTwoDigit(num) {
  num = num + "";
  if (num.length < 2) {
    num = "0" + num;
  }
  return num;
}

// Add button press event
$('#convert-btn').click(convert);
