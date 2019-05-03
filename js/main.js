/*
 * GENERAL
 */
// Conversion and error log
let log = '';
// Number of notes that have failed importing
let failedImports = 0;
// Set progress of the html progress bar, progress between 0-100
const setProgress = (progress) => {
  document.getElementById('loading-progress').style.width = `${progress}vw`;
}
// Timeout that is triggered if the conversion needs over 10s
let somethingWrongTimeout;

// Add errors to log
window.addEventListener("error", function (e) {
  log += "JavaScript error: " + e.message + "\n";
  return false;
})

/*
 * PAGE ROUTING 
 */
// Sequence of pages
const pages = ['start', 'select', 'loading', 'import', 'done'];
// Key of the current page in the pages array
let page = -1;

let currentPageName = 'page-merged';
let previousPageName;

// Open next instruction page
const openNextPage = () => {
  // Update page number
  page++;

  setProgress((page + 1) / pages.length * 100);

  // Get page id
  const pageId = `page-${pages[page]}`;

  openPage(pageId);
};

// Open previous instruction page
const openPreviousPage = () => {
  openPage(previousPageName);
};

// Open page via its element id
const openPage = (page) => {
  // Hide current page
  document.getElementById(currentPageName).classList.remove('active')
  document.getElementById(currentPageName).classList.add('out-left')

  // Show next page
  document.getElementById(page).classList.remove('hidden')
  document.getElementById(page).classList.add('active')

  // Update page names
  previousPageName = currentPageName;
  currentPageName = page;
}

// Open next page when clicking a `button.next` button
const nextButtons = document.getElementsByClassName('next');
for (const button of nextButtons) {
  button.addEventListener('click', openNextPage);
}

// Open previous page when clicking a `button.previous` button
const previousButtons = document.getElementsByClassName('previous');
for (const button of previousButtons) {
  button.addEventListener('click', openPreviousPage);
}

/*
 * FILE SELECTION AND READING
 */
// Convert file input files
const convertFileInput = () => {
  // Open loading page
  page = 2;
  openPage('page-loading');

  // Set timeout that triggers if there is probably something wrong
  somethingWrongTimeout = setTimeout(() => {
    openPage('page-error')
    document.getElementById('loading-progress').style.backgroundColor = '#EF5753'
  }, 10000);

  // Get file list
  const files = document.getElementById('files').files;
  let notes = [];

  // Read files one by one
  for (let i = 0, f; f = files[i]; i++) {
    var r = new FileReader();
    r.onload = (function(f) {
      return function(e) {
        const content = e.target.result;

        log += "Read " + f.name + "\n";

        // Add note to notes array
        notes.push({
          content,
          name: f.name.replace(/\.html$/, '')
        });
      };
    })(f);

    r.readAsText(f);
  }

  // Wait for loading of note files to complete
  let fileLoading = setInterval(() => {
    if (notes.length >= files.length) {
      // All files have been read, convert
      clearInterval(fileLoading);

      log += "Read all files, importing\n";

      // Import notes from files
      const importedNotes = importNotes(notes);

      // Export notes to StandardNotes format
      const exportedNotes = exportNotes(importedNotes);

      // Let user download archive
      downloadAsFile(
        JSON.stringify(exportedNotes), 
        "standardnotes-archive.json", 
        'text/plain'
      );
      log += "Downloaded file\n";

      // Conversion done, clean error timeout
      clearTimeout(somethingWrongTimeout);


      // Show next page dependend on number of failed imports
      if (failedImports == notes.length) {
        openPage('page-failed-all');
      } else if (failedImports > 0) {
        openPage('page-failed-some');
      } else {
        openNextPage();
      }
    }
  }, 0)
}

// Add file drop listener
document.ondragover = document.ondragenter = evt => {
  document.getElementById('drag-overlay').style.display = 'flex';
  evt.preventDefault();
};
document.ondragend = document.ondragexit = () => {
  document.getElementById('drag-overlay').style.display = 'none';
}
document.ondrop = evt => {
  document.getElementById('drag-overlay').style.display = 'none';
  
  if (evt.dataTransfer.files.length) {
    document.getElementById('files').files = evt.dataTransfer.files;
    convertFileInput();
  }
  evt.preventDefault();
};

// Listen for file selection
document.getElementById('files').addEventListener('change', convertFileInput)


/*
 * CONVERTING
 */
// Extract notes from raw archive
const importNotes = (rawNotes) => {
  log += "Importing " + rawNotes.length + " notes\n";

  let notes = [];

  for (let note of rawNotes) {
    log += "Importing note " + note.name + "\n";

    // Parse note html
    let el = document.createElement('html');
    el.innerHTML = note.content;

    // Try to get note content
    let content;
    try {
      let contentElement = el.getElementsByClassName('content')[0];

      // Replace <br> with \n so line breaks get recognised
      contentElement.innerHTML = contentElement.innerHTML.replace(/<br>/g, "\n");

      content = contentElement.innerText;
    } catch {
      log += "! Can't import note " + note.name + ": Not a valid note (.content not found)\n";
      failedImports++;
      continue;
    }

    // Try to get note title
    let title;
    try {
      title = el.getElementsByTagName('title')[0].innerText;
    } catch {
      log += "! Can't import note " + note.name + ": Not a valid note (title not found)\n";
      failedImports++;
      continue;
    }

    // Check if title is date (default if no title is set). If so, use empty string
    if (title !== '' && !isNaN(new Date(title))) {
      log += "Title of " + note.name + " is date, using empty string\n";
      title = '';
    }

    // Try to find creation date, usually before div.content or div.title
    const date = 
      getDateFromNote(true, note.content) || 
      getDateFromNote(false, note.content) || 
      new Date();
    

    notes.push({
      content,
      date,
      title
    });
  }

  log += "Imported all notes\n";

  return notes;
}

// Convert notes to StandardNotes format
const exportNotes = (notes) => {
  log += "Exporting " + notes.length + " notes\n";

  // Archive format used for StandardNotes
  let archive = {
    "items": []
  };

  for (let note of notes) {
    // Convert to StandardNotes archive item format
    const item = {
      created_at: note.date,
      updated_at: note.date,
      uuid: randomUuid(),
      content_type: 'Note',
      content: {
        title: note.title,
        text: note.content,
        references: [],
      },
    };

    log += "Exporting note " + item.uuid + "\n";
    
    archive.items.push(item);
  }

  log += "Exported all notes\n";

  return archive;
}

/*
 * LOG VIEWING
 */
// Show log when clicking a `button.view-log` button
let viewLogBtns = document.getElementsByClassName('view-log');
for (const button of viewLogBtns) {
  button.addEventListener('click', () => {
    log += "Showing logs\n";
  
    document.getElementById('log').innerText = log;
    openPage('page-log');
  })
}

/*
 * HELPER FUNCTIONS
 */
const getDateFromNote = (withTitle, note) => {
  let regex;
  if (withTitle) {
    regex = /.*(?=<\/div>\n<div class="title">)/;
  } else {
    regex = /.*(?=<\/div>\n\n<div class="content">)/;
  }
  const dateString = regex.exec(note);
  // Check if string exists at all
  if (dateString && dateString[0]) {
    // Check if string is valid date
    if (!isNaN(new Date(dateString))) {
      return new Date(dateString);
    } else {
      // Invalid date
      log += "Could not find valid date for note " + note.name + ", using now\n";
    }
  }
  return false;
}

// SOURCE: https://stackoverflow.com/a/2117523
const randomUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// SOURCE: https://stackoverflow.com/a/30832210
const downloadAsFile = (data, filename, type) => {
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