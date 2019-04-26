# Google Keep™ to StandardNotes Converter
Convert a Google Keep Takeout™ archive into a StandardNotes archive

# Usage
Go to [https://vantezzen.github.io/Google-Keep-to-Standardnotes-Converter/index.html](https://vantezzen.github.io/Google-Keep-to-Standardnotes-Converter/index.html) and follow the intructions.

# Q&A
Q: Where do my notes get send to to be converted?

A: Your notes are being converted locally in the browser so they do not get send to any server

Q: Is there a limit on how many notes can be converted?

A: Theoretically: no, practically: We don't know

Q: Which data will be converted?

A: We try to convert the text in your note, the title (if it exists), and the date it was created so your notes will keep their order

Q: The creation date of some/all of my notes havn't been converted, why?

A: Unfortunately, there is no universal date format used in the Google Keep Archive so we try to get the date from your archive but sometimes fail.

Q: "We could not import (some of) your notes" - What can I do?

A: This error appears if one or many of your notes are not in the default Google Takeout format. If this happens, please take a look at the conversion log. Inside this log you should find one or more `! Can't import note ...` statements, leading you to the notes that do not have the correct format.

Q: Are there any other limitations?

A: This converter simply converts everthing to text, resulting in formatted text and lists being converted without any formatting.

Q: I have found a bug.

A: Please report it in the [GitHub issue section](https://github.com/vantezzen/Google-Keep-to-Standardnotes-Converter/issues)